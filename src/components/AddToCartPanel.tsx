"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Product } from "@/lib/types";
import { useCart } from "./CartProvider";
import { inTelegram, openChat, tg } from "@/lib/telegram";
import { SHOP_USERNAME, stockEnquiryLink } from "@/lib/order-message";
import { money } from "@/lib/format";
import { CheckIcon, MinusIcon, PlusIcon, SendIcon } from "./icons";

/**
 * Fixed bottom action bar: quantity stepper + add to cart. Inside Telegram we
 * also drive the native MainButton, which is what mini app users reach for.
 *
 * Sold-out products can't be ordered through WooCommerce, so they get a
 * "Contact seller" action instead, which opens the shop's Telegram chat with
 * the product name and link already written out.
 */
export default function AddToCartPanel({ product }: { product: Product }) {
  const { add, qtyOf } = useCart();
  const [qty, setQty] = useState(1);
  const [justAdded, setJustAdded] = useState(false);
  const router = useRouter();
  const inCart = qtyOf(product.id);
  const soldOut = !product.inStock;

  const enquiryLink = soldOut
    ? stockEnquiryLink({
        name: product.name,
        slug: product.slug,
        sku: product.sku,
        price: money(product.price),
      })
    : null;

  useEffect(() => {
    const app = tg();
    // Outside Telegram the native button renders nothing — the in-page bar
    // below is the only control, so don't bother driving MainButton.
    if (!app || !inTelegram()) return;

    const button = app.MainButton;
    const onClick = () => {
      if (soldOut) {
        if (enquiryLink) openChat(enquiryLink);
        return;
      }
      add(product, qty);
      router.push("/cart");
    };

    // Nothing to offer when the shop account isn't configured.
    if (soldOut && !enquiryLink) return;

    button.setText(soldOut ? "Contact seller" : `Add ${qty} · ${money(product.price * qty)}`);
    button.show();
    button.onClick(onClick);

    return () => {
      button.offClick(onClick);
      button.hide();
    };
  }, [product, qty, add, router, soldOut, enquiryLink]);

  useEffect(() => {
    if (!justAdded) return;
    const id = setTimeout(() => setJustAdded(false), 1600);
    return () => clearTimeout(id);
  }, [justAdded]);

  if (soldOut) {
    return (
      <div className="glass fixed inset-x-0 bottom-[calc(var(--nav-h)+env(safe-area-inset-bottom))] z-30 border-t border-hairline px-4 pb-3.5 pt-3">
        <div className="mx-auto max-w-2xl">
          <button
            type="button"
            onClick={() => enquiryLink && openChat(enquiryLink)}
            disabled={!enquiryLink}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-brand text-[15px] font-semibold text-brand-fg shadow-brand transition active:scale-[0.98] disabled:bg-sunken disabled:text-tg-hint disabled:shadow-none"
          >
            <SendIcon className="h-4.5 w-4.5" />
            {enquiryLink ? "Contact seller" : "Out of stock"}
          </button>
          <p className="mx-auto max-w-2xl pt-2 text-center text-[11px] text-tg-hint">
            {enquiryLink
              ? `Out of stock — we'll send this product to @${SHOP_USERNAME} for you.`
              : "This product is currently out of stock."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass fixed inset-x-0 bottom-[calc(var(--nav-h)+env(safe-area-inset-bottom))] z-30 border-t border-hairline px-4 pb-3.5 pt-3">
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
          className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-brand text-[15px] font-semibold text-brand-fg shadow-brand transition active:scale-[0.98]"
        >
          {justAdded ? (
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
