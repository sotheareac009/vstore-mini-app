"use client";

import Link from "next/link";
import type { Product } from "@/lib/types";
import { money } from "@/lib/format";
import { useCart } from "./CartProvider";
import ProductImage from "./ProductImage";
import { MinusIcon, PlusIcon } from "./icons";

export default function ProductCard({ product }: { product: Product }) {
  const { add, setQty, qtyOf } = useCart();
  const qty = qtyOf(product.id);
  const discount =
    product.regularPrice && product.regularPrice > product.price
      ? Math.round((1 - product.price / product.regularPrice) * 100)
      : 0;

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-card border border-hairline bg-surface shadow-card">
      <Link
        href={`/product/${product.id}`}
        className="relative block aspect-square bg-sunken"
      >
        <ProductImage
          src={product.image}
          alt={product.name}
          sizes="(max-width: 640px) 50vw, 320px"
          className={`object-contain p-3 transition-transform duration-300 group-active:scale-95 ${
            product.inStock ? "" : "opacity-40 saturate-0"
          }`}
        />

        {discount > 0 && (
          <span className="numeric absolute left-2.5 top-2.5 rounded-full bg-brand px-2 py-0.75 text-[10px] font-bold tracking-tight text-brand-fg shadow-sm">
            −{discount}%
          </span>
        )}

        {!product.inStock && (
          <span className="absolute inset-x-0 bottom-0 bg-tg-text/75 py-1 text-center text-[10px] font-semibold uppercase tracking-wider text-surface">
            Sold out
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-2 p-3">
        <Link
          href={`/product/${product.id}`}
          className="line-clamp-2 text-[13px] font-medium leading-[1.35] tracking-[-0.01em] text-tg-text"
        >
          {product.name}
        </Link>

        <div className="mt-auto flex items-end justify-between gap-2 pt-0.5">
          <div className="min-w-0">
            <p className="numeric truncate text-[15px] font-semibold leading-tight">
              {money(product.price)}
            </p>
            {product.regularPrice && (
              <p className="numeric truncate text-[11px] leading-tight text-tg-hint line-through">
                {money(product.regularPrice)}
              </p>
            )}
          </div>

          {qty === 0 ? (
            <button
              type="button"
              onClick={() => add(product)}
              disabled={!product.inStock}
              aria-label={`Add ${product.name} to cart`}
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand text-brand-fg shadow-brand transition active:scale-90 disabled:bg-sunken disabled:text-tg-hint disabled:shadow-none"
            >
              <PlusIcon className="h-3.75 w-3.75" />
            </button>
          ) : (
            <div className="flex h-8 shrink-0 items-center gap-0.5 rounded-full bg-brand-soft px-1 text-brand-ink">
              <button
                type="button"
                onClick={() => setQty(product.id, qty - 1)}
                aria-label={`Decrease ${product.name}`}
                className="grid h-6 w-6 place-items-center rounded-full transition active:scale-90"
              >
                <MinusIcon className="h-3.5 w-3.5" />
              </button>
              <span className="numeric min-w-3.5 text-center text-[13px] font-bold">
                {qty}
              </span>
              <button
                type="button"
                onClick={() => add(product)}
                aria-label={`Increase ${product.name}`}
                className="grid h-6 w-6 place-items-center rounded-full transition active:scale-90"
              >
                <PlusIcon className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
