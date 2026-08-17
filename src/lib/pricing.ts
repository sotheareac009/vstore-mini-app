import "server-only";
import type { Product } from "./types";

/**
 * Live prices from WooCommerce.
 *
 * The catalogue is read straight from MySQL for speed, but that bypasses
 * WooCommerce entirely — so any pricing applied by a plugin at runtime is
 * invisible there. The store's promotions work exactly that way: the rules
 * live in the `shopys_cat_promos` option and are applied through WooCommerce's
 * price filters, never written to `_sale_price` or the product lookup table.
 *
 * Asking WooCommerce for the price picks all of that up — promotions now, and
 * anything else that filters prices later — without copying the rules here.
 * Prices are fetched in batches and cached briefly, so listing stays a single
 * SQL query plus one HTTP call per page.
 */

const STORE_URL = (process.env.WC_STORE_URL ?? "").replace(/\/$/, "");
const KEY = process.env.WC_CONSUMER_KEY ?? "";
const SECRET = process.env.WC_CONSUMER_SECRET ?? "";

/** Long enough to cover a browsing session, short enough to pick up edits. */
const TTL_MS = 90_000;

/** WooCommerce caps `per_page` at 100. */
const BATCH = 100;

type LivePrice = { price: number; regularPrice: number | null; onSale: boolean };

const cache = new Map<number, { value: LivePrice; expires: number }>();

/** In-flight batches, so a burst of requests doesn't refetch the same ids. */
const pending = new Map<number, Promise<void>>();

function configured(): boolean {
  return Boolean(STORE_URL && KEY && SECRET);
}

function authHeader(): string {
  return `Basic ${Buffer.from(`${KEY}:${SECRET}`).toString("base64")}`;
}

type WooPrice = {
  id: number;
  price: string;
  regular_price: string;
  on_sale: boolean;
};

function toLivePrice(row: WooPrice): LivePrice {
  const price = Number(row.price);
  const regular = Number(row.regular_price);
  const hasRegular = Number.isFinite(regular) && regular > 0;

  return {
    price: Number.isFinite(price) ? price : 0,
    // Only meaningful when it's actually higher — otherwise there's nothing to
    // strike through.
    regularPrice: hasRegular && regular > price ? regular : null,
    onSale: Boolean(row.on_sale) || (hasRegular && regular > price),
  };
}

async function fetchBatch(ids: number[]): Promise<void> {
  const url =
    `${STORE_URL}/wp-json/wc/v3/products` +
    `?include=${ids.join(",")}&per_page=${ids.length}` +
    // Only the pricing fields — the full product payload would be far larger.
    `&_fields=id,price,regular_price,on_sale`;

  const response = await fetch(url, {
    headers: { Authorization: authHeader() },
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`WooCommerce prices: HTTP ${response.status}`);

  const rows = (await response.json()) as WooPrice[];
  const expires = Date.now() + TTL_MS;
  for (const row of rows) {
    cache.set(Number(row.id), { value: toLivePrice(row), expires });
  }
}

/**
 * Overlays WooCommerce's prices onto products read from the database.
 *
 * Failures are deliberately swallowed: a promotion showing at the old price is
 * a much smaller problem than a storefront that won't render, so the database
 * prices stand in whenever WooCommerce can't be reached.
 */
export async function withLivePrices<T extends Product>(products: T[]): Promise<T[]> {
  if (!configured() || !products.length) return products;

  const now = Date.now();
  const stale = products
    .map((p) => p.id)
    .filter((id) => {
      const hit = cache.get(id);
      return (!hit || hit.expires <= now) && !pending.has(id);
    });

  if (stale.length) {
    const batches: Promise<void>[] = [];
    for (let i = 0; i < stale.length; i += BATCH) {
      const ids = stale.slice(i, i + BATCH);
      const job = fetchBatch(ids).finally(() => ids.forEach((id) => pending.delete(id)));
      ids.forEach((id) => pending.set(id, job));
      batches.push(job);
    }
    try {
      await Promise.all(batches);
    } catch (error) {
      console.error("Live price lookup failed — falling back to stored prices", error);
    }
  }

  // Wait on any batch another request already had in flight for these ids.
  await Promise.allSettled(products.map((p) => pending.get(p.id)).filter(Boolean));

  return products.map((product) => {
    const hit = cache.get(product.id);
    if (!hit) return product;

    const { price, regularPrice, onSale } = hit.value;
    if (price === product.price && regularPrice === product.regularPrice) return product;

    return {
      ...product,
      price,
      regularPrice,
      onSale,
      // A variable product's ceiling isn't returned by this lookup; keep the
      // stored one but never let it fall below the live price.
      maxPrice: Math.max(product.maxPrice, price),
    };
  });
}
