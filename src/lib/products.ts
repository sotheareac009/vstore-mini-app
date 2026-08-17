import "server-only";
import { P, query } from "./db";
import type { Category, Product, ProductDetail, ProductPage, Sort } from "./types";
import { SORTS } from "./types";

import { UPLOADS_BASE } from "./images";

function imageUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  // Some uploads have Khmer filenames; percent-encode each segment so the URL
  // survives characters like ?, # and spaces as well as non-ASCII.
  const encoded = path.split("/").map(encodeURIComponent).join("/");
  return `${UPLOADS_BASE}/${encoded}`;
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
  };
}

/**
 * Columns + joins shared by the list and detail queries.
 * `extra` adds columns only the detail view needs (post_content is large).
 */
const selectProduct = (extra = "") => `
  SELECT
    ${extra}
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
  const [row] = await query<ProductRow & { description: string | null }>(
    `${selectProduct("p.post_content AS description,")}
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
    gallery: base.image ? [base.image, ...gallery] : gallery,
    categories: categories.map((c) => ({ ...c, id: Number(c.id) })),
  };
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
