"use client";

import Link from "next/link";
import type { Product } from "@/lib/types";
import { money } from "@/lib/format";
import { useCart } from "./CartProvider";
import ProductImage from "./ProductImage";
import { stockEnquiryLink } from "@/lib/order-message";
import { openChat } from "@/lib/telegram";
import { MinusIcon, PlusIcon, SendIcon } from "./icons";

export default function ProductCard({ product }: { product: Product }) {
  const { add, setQty, qtyOf } = useCart();
  const qty = qtyOf(product.id);
  const discount =
    product.regularPrice && product.regularPrice > product.price
      ? Math.round((1 - product.price / product.regularPrice) * 100)
      : 0;

  // Sold-out items can't be ordered, so the card offers the seller instead —
  // same action as the product page, reachable without opening it.
  const enquiryLink = product.inStock
    ? null
    : stockEnquiryLink({
        name: product.name,
        slug: product.slug,
        sku: product.sku,
        price: money(product.price),
      });

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

        {/* Specs come from the description, so plenty of products have none —
            the row simply disappears rather than leaving a gap. */}
        {product.specs.length > 0 && (
          <dl className="space-y-0.5 border-t border-hairline pt-1.5 text-[11px] leading-[1.35]">
            {product.specs.map((spec) => (
              <div key={spec.label} className="flex gap-1.5">
                <dt className="shrink-0 text-tg-hint">{spec.label}</dt>
                <dd className="min-w-0 flex-1 truncate text-right font-medium text-tg-text/85">
                  {spec.value}
                </dd>
              </div>
            ))}
          </dl>
        )}

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

          {!product.inStock ? (
            <button
              type="button"
              onClick={() => enquiryLink && openChat(enquiryLink)}
              disabled={!enquiryLink}
              aria-label={`Contact the seller about ${product.name}`}
              title="Contact seller"
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand text-brand-fg shadow-brand transition active:scale-90 disabled:bg-sunken disabled:text-tg-hint disabled:shadow-none"
            >
              <SendIcon className="h-3.75 w-3.75" />
            </button>
          ) : qty === 0 ? (
            <button
              type="button"
              onClick={() => add(product)}
              aria-label={`Add ${product.name} to cart`}
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand text-brand-fg shadow-brand transition active:scale-90"
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
