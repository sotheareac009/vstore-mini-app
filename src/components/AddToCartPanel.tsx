"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Product } from "@/lib/types";
import { useCart } from "./CartProvider";
import { tg } from "@/lib/telegram";
import { money } from "@/lib/format";

/**
 * Quantity stepper + add-to-cart. On the detail page we also drive Telegram's
 * native MainButton, which is what users expect inside a mini app.
 */
export default function AddToCartPanel({ product }: { product: Product }) {
  const { add, qtyOf } = useCart();
  const [qty, setQty] = useState(1);
  const router = useRouter();
  const inCart = qtyOf(product.id);

  useEffect(() => {
    const app = tg();
    if (!app || !product.inStock) return;

    const button = app.MainButton;
    const onClick = () => {
      add(product, qty);
      router.push("/cart");
    };

    button.setText(`Add ${qty} · ${money(product.price * qty)}`);
    button.show();
    button.onClick(onClick);

    return () => {
      button.offClick(onClick);
      button.hide();
    };
  }, [product, qty, add, router]);

  return (
    <div className="space-y-3 px-4">
      <div className="flex items-center gap-3">
        <span className="text-sm text-tg-hint">Quantity</span>
        <div className="flex items-center overflow-hidden rounded-xl bg-tg-secondary">
          <button
            type="button"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            className="px-4 py-2 text-lg leading-none"
            aria-label="Decrease quantity"
          >
            −
          </button>
          <span className="min-w-8 text-center text-sm font-semibold">{qty}</span>
          <button
            type="button"
            onClick={() => setQty((q) => q + 1)}
            className="px-4 py-2 text-lg leading-none"
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>
        {inCart > 0 && <span className="text-xs text-tg-hint">{inCart} already in cart</span>}
      </div>

      <button
        type="button"
        onClick={() => add(product, qty)}
        disabled={!product.inStock}
        className="w-full rounded-2xl bg-brand py-3 text-sm font-semibold text-brand-fg transition active:scale-[0.99] disabled:opacity-40"
      >
        {product.inStock
          ? `Add to cart · ${money(product.price * qty)}`
          : "Out of stock"}
      </button>
    </div>
  );
}
