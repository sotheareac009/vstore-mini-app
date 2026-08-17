import "server-only";
import { P, query } from "./db";
import type {
  Category,
  Crumb,
  DescriptionBlock,
  Product,
  ProductDetail,
  ProductPage,
  Sort,
  Spec,
} from "./types";
import { SORTS } from "./types";

import { UPLOADS_BASE } from "./images";

function imageUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  // Some uploads have Khmer filenames; percent-encode each segment so the URL
  // survives characters like ?, # and spaces as well as non-ASCII.
  const encoded = path.split("/").map(encodeURIComponent).join("/");
  return `${UPLOADS_BASE}/${encoded}`;
}

/**
 * Splits description HTML into lines.
 *
 * Descriptions here are tables of one-line cells, so every block boundary has
 * to become a newline before the tags go — otherwise the whole thing collapses
 * into a single run-on string.
 */
function descriptionLines(html: string): string[] {
  return html
    // Opening <li> becomes a bullet marker so genuine HTML lists are treated
    // the same as the store's hand-written "-item" lines.
    .replace(/<\s*li[^>]*>/gi, "\n• ")
    .replace(/<\s*(br|\/p|\/div|\/li|\/td|\/tr|\/h[1-6])[^>]*>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#8211;/g, "-")
    .replace(/&quot;/g, '"')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

/**
 * `CPU: Snapdragon x2 Elite` → { label, value }. The value is allowed to be
 * empty so callers can recognise and drop blank rows like `GPU:` rather than
 * having them fall through and be treated as prose.
 */
const SPEC_LINE = /^([A-Za-z][A-Za-z0-9 /.+-]{1,22}?)\s*[:：]\s*(.*)$/;

/**
 * Pulls "CPU: Intel Core Ultra 9" style lines out of a product description,
 * for the compact spec list on a product card.
 *
 * The store keeps specs in the description rather than as WooCommerce
 * attributes — its laptops have no attributes, no SKU and no short
 * description, so this is the only structured detail available.
 */
function parseSpecs(html: string | null | undefined, limit = 5): Spec[] {
  if (!html) return [];

  const lines = descriptionLines(html);
  const specs: Spec[] = [];
  const seen = new Set<string>();

  for (const line of lines) {
    const match = SPEC_LINE.exec(line);
    if (!match) continue;

    const [, label, value] = match;
    const key = label.toLowerCase();
    if (!value || seen.has(key)) continue;

    seen.add(key);
    specs.push({ label, value: value.slice(0, 60) });
    if (specs.length >= limit) break;
  }

  return specs;
}

/**
 * Structures a description for the product page.
 *
 * The store's own conventions carry the formatting: `Label: value` rows are a
 * spec table, `+Section` starts a heading, `-item` is a bullet. Anything else
 * is a paragraph. Consecutive lines of the same kind are grouped so they
 * render as one table or one list.
 */
function parseDescription(html: string | null | undefined): DescriptionBlock[] {
  if (!html) return [];

  const blocks: DescriptionBlock[] = [];

  /** Append to the trailing block when it matches, otherwise start a new one. */
  const push = (block: DescriptionBlock) => {
    const last = blocks[blocks.length - 1];
    if (last?.type === "specs" && block.type === "specs") {
      last.items.push(...block.items);
    } else if (last?.type === "list" && block.type === "list") {
      last.items.push(...block.items);
    } else {
      blocks.push(block);
    }
  };

  for (const line of descriptionLines(html)) {
    const bullet = /^[-–—•*]\s*(.+)$/.exec(line);
    if (bullet) {
      push({ type: "list", items: [bullet[1].trim()] });
      continue;
    }

    if (line.startsWith("+")) {
      const text = line.slice(1).trim();
      if (text) blocks.push({ type: "heading", text });
      continue;
    }

    const spec = SPEC_LINE.exec(line);
    if (spec) {
      // "GPU:" with nothing after it is a blank row in the source table.
      // Dropping it keeps the surrounding specs as one continuous table
      // instead of splitting them around a stray paragraph.
      if (spec[2]?.trim()) {
        push({ type: "specs", items: [{ label: spec[1], value: spec[2].trim() }] });
      }
      continue;
    }

    blocks.push({ type: "text", text: line });
  }

  return blocks;
}

function stripHtml(html: string | null | undefined): string {
  if (!html) return "";
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#8211;/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

type ProductRow = {
  id: number;
  name: string;
  slug: string;
  sku: string | null;
  price: string | null;
  maxPrice: string | null;
  regularPrice: string | null;
  onsale: number;
  stockStatus: string | null;
  stockQuantity: number | null;
  totalSales: number | null;
  imgPath: string | null;
  excerpt: string | null;
  description: string | null;
};

function toProduct(r: ProductRow): Product {
  const price = Number(r.price ?? 0);
  const regular = r.regularPrice != null ? Number(r.regularPrice) : null;
  return {
    id: Number(r.id),
    name: stripHtml(r.name),
    slug: r.slug,
    sku: r.sku || null,
    price,
    maxPrice: Number(r.maxPrice ?? r.price ?? 0),
    regularPrice: regular && regular > price ? regular : null,
    onSale: Boolean(r.onsale) || (regular != null && regular > price),
    inStock: (r.stockStatus ?? "instock") === "instock",
    stockQuantity: r.stockQuantity != null ? Number(r.stockQuantity) : null,
    totalSales: Number(r.totalSales ?? 0),
    image: imageUrl(r.imgPath),
    excerpt: stripHtml(r.excerpt).slice(0, 180),
    specs: parseSpecs(r.description),
  };
}

/**
 * Columns + joins shared by the list and detail queries.
 *
 * post_content comes along even in the list: the card shows the CPU/RAM/GPU
 * lines, which only exist in the description. It is parsed down to a handful
 * of specs on the server, so the extra weight never reaches the browser.
 */
const selectProduct = () => `
  SELECT
    p.post_content    AS description,
    p.ID              AS id,
    p.post_title      AS name,
    p.post_name       AS slug,
    p.post_excerpt    AS excerpt,
    l.sku             AS sku,
    l.min_price       AS price,
    l.max_price       AS maxPrice,
    rp.meta_value     AS regularPrice,
    l.onsale          AS onsale,
    l.stock_status    AS stockStatus,
    l.stock_quantity  AS stockQuantity,
    l.total_sales     AS totalSales,
    am.meta_value     AS imgPath
  FROM ${P}posts p
  JOIN ${P}wc_product_meta_lookup l ON l.product_id = p.ID
  LEFT JOIN ${P}postmeta rp ON rp.post_id = p.ID AND rp.meta_key = '_regular_price'
  LEFT JOIN ${P}postmeta tm ON tm.post_id = p.ID AND tm.meta_key = '_thumbnail_id'
  LEFT JOIN ${P}postmeta am ON am.post_id = tm.meta_value AND am.meta_key = '_wp_attached_file'
`;

const ORDER_BY: Record<Sort, string> = {
  newest: "p.post_date DESC, p.ID DESC",
  "price-asc": "l.min_price ASC, p.ID DESC",
  "price-desc": "l.min_price DESC, p.ID DESC",
  popular: "l.total_sales DESC, p.ID DESC",
};

export function parseSort(value: string | undefined): Sort {
  return SORTS.includes(value as Sort) ? (value as Sort) : "newest";
}

export type ListOptions = {
  search?: string;
  category?: string;
  sort?: Sort;
  page?: number;
  perPage?: number;
};

export async function listProducts(opts: ListOptions = {}): Promise<ProductPage> {
  const page = Math.max(1, Math.floor(opts.page ?? 1));
  const perPage = Math.min(48, Math.max(1, Math.floor(opts.perPage ?? 24)));
  const sort = parseSort(opts.sort);

  const where: string[] = ["p.post_type = 'product'", "p.post_status = 'publish'"];
  const params: unknown[] = [];

  const search = opts.search?.trim();
  if (search) {
    where.push("(p.post_title LIKE ? OR l.sku LIKE ?)");
    params.push(`%${search}%`, `%${search}%`);
  }

  if (opts.category) {
    where.push(`p.ID IN (
      SELECT tr.object_id
      FROM ${P}term_relationships tr
      JOIN ${P}term_taxonomy tt ON tt.term_taxonomy_id = tr.term_taxonomy_id
      JOIN ${P}terms t ON t.term_id = tt.term_id
      WHERE tt.taxonomy = 'product_cat' AND t.slug = ?
    )`);
    params.push(opts.category);
  }

  const whereSql = `WHERE ${where.join(" AND ")}`;

  const [countRow] = await query<{ total: number }>(
    `SELECT COUNT(*) AS total
     FROM ${P}posts p
     JOIN ${P}wc_product_meta_lookup l ON l.product_id = p.ID
     ${whereSql}`,
    params,
  );

  const rows = await query<ProductRow>(
    `${selectProduct()} ${whereSql} ORDER BY ${ORDER_BY[sort]} LIMIT ? OFFSET ?`,
    [...params, perPage, (page - 1) * perPage],
  );

  const total = Number(countRow?.total ?? 0);
  return {
    items: rows.map(toProduct),
    total,
    page,
    perPage,
    hasMore: page * perPage < total,
  };
}

export async function getProduct(id: number): Promise<ProductDetail | null> {
  const [row] = await query<ProductRow>(
    `${selectProduct()}
     WHERE p.ID = ? AND p.post_type = 'product' AND p.post_status = 'publish'
     LIMIT 1`,
    [id],
  );
  if (!row) return null;

  const [galleryMeta] = await query<{ meta_value: string }>(
    `SELECT meta_value FROM ${P}postmeta
     WHERE post_id = ? AND meta_key = '_product_image_gallery' LIMIT 1`,
    [id],
  );

  const galleryIds = (galleryMeta?.meta_value ?? "")
    .split(",")
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isFinite(n) && n > 0);

  let gallery: string[] = [];
  if (galleryIds.length) {
    const files = await query<{ post_id: number; meta_value: string }>(
      `SELECT post_id, meta_value FROM ${P}postmeta
       WHERE meta_key = '_wp_attached_file' AND post_id IN (${galleryIds.map(() => "?").join(",")})`,
      galleryIds,
    );
    const byId = new Map(files.map((f) => [Number(f.post_id), f.meta_value]));
    gallery = galleryIds
      .map((gid) => imageUrl(byId.get(gid)))
      .filter((url): url is string => Boolean(url));
  }

  const categories = await query<{ id: number; name: string; slug: string }>(
    `SELECT t.term_id AS id, t.name, t.slug
     FROM ${P}term_relationships tr
     JOIN ${P}term_taxonomy tt ON tt.term_taxonomy_id = tr.term_taxonomy_id
     JOIN ${P}terms t ON t.term_id = tt.term_id
     WHERE tr.object_id = ? AND tt.taxonomy = 'product_cat'
     ORDER BY tt.count DESC`,
    [id],
  );

  const base = toProduct(row);
  return {
    ...base,
    description: stripHtml(row.description),
    blocks: parseDescription(row.description),
    gallery: base.image ? [base.image, ...gallery] : gallery,
    categories: categories.map((c) => ({ ...c, id: Number(c.id) })),
  };
}

type TermRow = { id: number; name: string; slug: string; parent: number };

/** All product categories (97 rows) — cheap enough to walk in memory. */
async function loadCategoryTerms(): Promise<TermRow[]> {
  const rows = await query<TermRow>(
    `SELECT t.term_id AS id, t.name, t.slug, tt.parent
     FROM ${P}terms t
     JOIN ${P}term_taxonomy tt ON tt.term_id = t.term_id
     WHERE tt.taxonomy = 'product_cat'`,
  );
  return rows.map((r) => ({ ...r, id: Number(r.id), parent: Number(r.parent) }));
}

function walkUp(terms: TermRow[], startId: number): Crumb[] {
  const byId = new Map(terms.map((t) => [t.id, t]));
  const trail: Crumb[] = [];
  const seen = new Set<number>();

  let current = byId.get(startId);
  while (current && !seen.has(current.id)) {
    seen.add(current.id); // guard against a malformed parent cycle
    trail.unshift({ name: current.name, slug: current.slug });
    current = current.parent ? byId.get(current.parent) : undefined;
  }
  return trail;
}

/** Ancestor trail for a category slug, root first. */
export async function getCategoryPath(slug: string): Promise<Crumb[]> {
  if (!slug) return [];
  const terms = await loadCategoryTerms();
  const term = terms.find((t) => t.slug === slug);
  return term ? walkUp(terms, term.id) : [];
}

/**
 * Trail for a product. A product is usually filed under several categories at
 * once, so pick the deepest (most specific) one and follow its ancestors —
 * "Component / Cooler / Liquid Cooler" says far more than "All Product".
 */
export async function getProductCategoryPath(categoryIds: number[]): Promise<Crumb[]> {
  if (!categoryIds.length) return [];
  const terms = await loadCategoryTerms();

  let best: Crumb[] = [];
  for (const id of categoryIds) {
    const trail = walkUp(terms, id);
    if (trail.length > best.length) best = trail;
  }
  return best;
}

/**
 * Subcategories to offer for one section, flattened.
 *
 * The tree is up to three levels deep (Component → RAM → Desktop → DDR5), but
 * a phone has no room for nested menus, so every descendant with products is
 * returned as one flat list ordered by size — the same thing the website's own
 * filter bar does.
 */
type CategoryRow = Category & { parent: number };

async function loadCategoryRows(): Promise<CategoryRow[]> {
  const rows = await query<CategoryRow>(
    `SELECT t.term_id AS id, t.name, t.slug, tt.count, tt.parent
     FROM ${P}terms t
     JOIN ${P}term_taxonomy tt ON tt.term_id = t.term_id
     WHERE tt.taxonomy = 'product_cat'`,
  );
  return rows.map((r) => ({
    ...r,
    id: Number(r.id),
    count: Number(r.count),
    parent: Number(r.parent),
  }));
}

/** Every descendant of `rootSlug` that has products, largest first. */
function descendantsOf(all: CategoryRow[], rootSlug: string): Category[] {
  const root = all.find((t) => t.slug === rootSlug);
  if (!root) return [];

  const childrenOf = new Map<number, CategoryRow[]>();
  for (const term of all) {
    const siblings = childrenOf.get(term.parent) ?? [];
    siblings.push(term);
    childrenOf.set(term.parent, siblings);
  }

  const out: Category[] = [];
  const seen = new Set<number>([root.id]); // also guards against a parent cycle
  const queue = [root.id];

  while (queue.length) {
    for (const child of childrenOf.get(queue.shift()!) ?? []) {
      if (seen.has(child.id)) continue;
      seen.add(child.id);
      queue.push(child.id);
      if (child.count > 0) {
        out.push({ id: child.id, name: child.name, slug: child.slug, count: child.count });
      }
    }
  }

  return out.sort((a, b) => b.count - a.count);
}

export async function getSubcategories(sectionSlug: string): Promise<Category[]> {
  return descendantsOf(await loadCategoryRows(), sectionSlug);
}

/**
 * Subcategories for every nav section, from a single query.
 *
 * The bottom navigation needs the whole map up front, not one section at a
 * time: it has to know that `gaming-asus` sits under Laptop in order to
 * highlight the right tab on load.
 */
export async function getNavTree(sectionSlugs: string[]): Promise<Record<string, Category[]>> {
  const all = await loadCategoryRows();
  return Object.fromEntries(sectionSlugs.map((slug) => [slug, descendantsOf(all, slug)]));
}

export async function getCategories(limit = 20): Promise<Category[]> {
  const rows = await query<Category>(
    `SELECT t.term_id AS id, t.name, t.slug, tt.count
     FROM ${P}terms t
     JOIN ${P}term_taxonomy tt ON tt.term_id = t.term_id
     WHERE tt.taxonomy = 'product_cat' AND tt.count > 0
     ORDER BY tt.count DESC
     LIMIT ?`,
    [limit],
  );
  return rows.map((r) => ({ ...r, id: Number(r.id), count: Number(r.count) }));
}
