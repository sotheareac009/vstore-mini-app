"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Product } from "@/lib/types";
import { useCart } from "./CartProvider";
import { tg } from "@/lib/telegram";
import { money } from "@/lib/format";
import { CheckIcon, MinusIcon, PlusIcon } from "./icons";

/**
 * Fixed bottom action bar: quantity stepper + add to cart. Inside Telegram we
 * also drive the native MainButton, which is what mini app users reach for.
 */
export default function AddToCartPanel({ product }: { product: Product }) {
  const { add, qtyOf } = useCart();
  const [qty, setQty] = useState(1);
  const [justAdded, setJustAdded] = useState(false);
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

  useEffect(() => {
    if (!justAdded) return;
    const id = setTimeout(() => setJustAdded(false), 1600);
    return () => clearTimeout(id);
  }, [justAdded]);

  return (
    <div className="glass fixed inset-x-0 bottom-0 z-30 border-t border-hairline px-4 pb-[max(0.875rem,env(safe-area-inset-bottom))] pt-3">
      <div className="mx-auto flex max-w-2xl items-center gap-3">
        <div className="flex h-12 shrink-0 items-center gap-1 rounded-full border border-hairline bg-surface px-1.5 shadow-sm">
          <button
            type="button"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            disabled={qty <= 1}
            aria-label="Decrease quantity"
            className="grid h-9 w-9 place-items-center rounded-full transition active:scale-90 disabled:opacity-30"
          >
            <MinusIcon className="h-4 w-4" />
          </button>
          <span className="numeric min-w-6 text-center text-[15px] font-bold">{qty}</span>
          <button
            type="button"
            onClick={() => setQty((q) => q + 1)}
            aria-label="Increase quantity"
            className="grid h-9 w-9 place-items-center rounded-full transition active:scale-90"
          >
            <PlusIcon className="h-4 w-4" />
          </button>
        </div>

        <button
          type="button"
          onClick={() => {
            add(product, qty);
            setJustAdded(true);
          }}
          disabled={!product.inStock}
          className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-brand text-[15px] font-semibold text-brand-fg shadow-brand transition active:scale-[0.98] disabled:bg-sunken disabled:text-tg-hint disabled:shadow-none"
        >
          {!product.inStock ? (
            "Out of stock"
          ) : justAdded ? (
            <>
              <CheckIcon className="h-[18px] w-[18px]" />
              Added
            </>
          ) : (
            <>
              Add to cart
              <span className="numeric opacity-70">·</span>
              <span className="numeric">{money(product.price * qty)}</span>
            </>
          )}
        </button>
      </div>

      {inCart > 0 && (
        <p className="numeric mx-auto max-w-2xl pt-2 text-center text-[11px] text-tg-hint">
          {inCart} already in your cart
        </p>
      )}
    </div>
  );
}
