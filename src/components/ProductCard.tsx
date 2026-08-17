"use client";

import Link from "next/link";
import ProductImage from "./ProductImage";
import type { Product } from "@/lib/types";
import { money } from "@/lib/format";
import { useCart } from "./CartProvider";

export default function ProductCard({ product }: { product: Product }) {
  const { add, qtyOf } = useCart();
  const qty = qtyOf(product.id);

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl bg-tg-secondary">
      <Link href={`/product/${product.id}`} className="relative block aspect-square bg-white">
        <ProductImage
          src={product.image}
          alt={product.name}
          sizes="(max-width: 640px) 50vw, 320px"
        />
        {product.onSale && (
          <span className="absolute left-2 top-2 rounded-full bg-tg-danger px-2 py-0.5 text-[10px] font-semibold text-white">
            SALE
          </span>
        )}
        {!product.inStock && (
          <span className="absolute right-2 top-2 rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-semibold text-white">
            Out of stock
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-1 p-3">
        <Link
          href={`/product/${product.id}`}
          className="line-clamp-2 text-[13px] leading-snug font-medium"
        >
          {product.name}
        </Link>

        <div className="mt-auto flex items-baseline gap-1.5 pt-1">
          <span className="text-[15px] font-bold">{money(product.price)}</span>
          {product.regularPrice && (
            <span className="text-xs text-tg-hint line-through">
              {money(product.regularPrice)}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => add(product)}
          disabled={!product.inStock}
          className="mt-2 rounded-xl bg-tg-button px-3 py-2 text-[13px] font-semibold text-tg-button-text transition active:scale-[0.97] disabled:opacity-40"
        >
          {qty > 0 ? `In cart (${qty})` : "Add to cart"}
        </button>
      </div>
    </div>
  );
}
