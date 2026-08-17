/**
 * Product image URL helpers.
 *
 * Images live in the WordPress uploads folder. Locally that folder is only a
 * partial sync of production, so we build a cascade of candidate URLs per
 * image: WooCommerce's resized variant first (much smaller), then the
 * original, then the same two on the fallback host. ProductImage walks this
 * list on each load error and shows a placeholder only if all of them fail.
 */

const PRIMARY = (
  process.env.NEXT_PUBLIC_UPLOADS_BASE_URL ??
  process.env.UPLOADS_BASE_URL ??
  "https://vstorecenter.com/wp-content/uploads"
).replace(/\/$/, "");

const FALLBACK = (process.env.NEXT_PUBLIC_UPLOADS_FALLBACK_URL ?? "").replace(/\/$/, "");

export const UPLOADS_BASE = PRIMARY;
export const UPLOADS_FALLBACK = FALLBACK;

/** WooCommerce-generated sizes that exist alongside every original. */
export type ImageSize = 150 | 300 | 600 | null;

/** `…/32.jpg` + 300 → `…/32-300x300.jpg` */
function withSize(url: string, size: ImageSize): string | null {
  if (!size) return null;
  const match = /^(.*)\.([a-zA-Z0-9]+)$/.exec(url);
  if (!match) return null;
  const [, base, ext] = match;
  // Already a resized variant — don't stack suffixes.
  if (/-\d+x\d+$/.test(base)) return null;
  return `${base}-${size}x${size}.${ext}`;
}

function onFallbackHost(url: string): string | null {
  if (!FALLBACK || !url.startsWith(PRIMARY)) return null;
  return FALLBACK + url.slice(PRIMARY.length);
}

/** Ordered list of URLs to try for one product image. */
export function imageCandidates(src: string | null, size: ImageSize = 300): string[] {
  if (!src) return [];

  const mirrored = onFallbackHost(src);
  const candidates = [
    withSize(src, size),
    mirrored ? withSize(mirrored, size) : null,
    src,
    mirrored,
  ];

  return [...new Set(candidates.filter((u): u is string => Boolean(u)))];
}
