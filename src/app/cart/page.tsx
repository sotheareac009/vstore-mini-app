"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import ProductImage from "@/components/ProductImage";
import { useCart } from "@/components/CartProvider";
import { money } from "@/lib/format";
import { tg } from "@/lib/telegram";
import { BagIcon, MinusIcon, PlusIcon, TrashIcon } from "@/components/icons";

export default function CartPage() {
  const { items, count, total, ready, setQty, remove, clear } = useCart();
  const [sent, setSent] = useState(false);

  // Telegram's MainButton doubles as the checkout action inside the mini app.
  useEffect(() => {
    const app = tg();
    if (!app) return;

    const button = app.MainButton;
    const onClick = () => {
      app.sendData(
        JSON.stringify({
          type: "order",
          items: items.map((i) => ({ id: i.id, qty: i.qty, price: i.price })),
          total,
        }),
      );
      setSent(true);
    };

    if (count === 0) {
      button.hide();
      return;
    }

    button.setText(`Checkout · ${money(total)}`);
    button.show();
    button.onClick(onClick);
    return () => {
      button.offClick(onClick);
      button.hide();
    };
  }, [items, count, total]);

  if (!ready) {
    return (
      <main className="space-y-3 px-4 pt-6">
        {[0, 1, 2].map((i) => (
          <div key={i} className="shimmer h-24 rounded-card" />
        ))}
      </main>
    );
  }

  if (count === 0) {
    return (
      <main className="flex flex-col items-center justify-center gap-4 px-8 py-24 text-center">
        <span className="grid h-16 w-16 place-items-center rounded-full bg-surface text-tg-hint shadow-card">
          <BagIcon className="h-7 w-7" />
        </span>
        <div>
          <p className="text-[17px] font-semibold">
            {sent ? "Order sent" : "Your cart is empty"}
          </p>
          <p className="mt-1 text-[13px] leading-relaxed text-tg-hint">
            {sent
              ? "Check your chat with the bot to confirm."
              : "Browse the catalogue and add something you like."}
          </p>
        </div>
        <Link
          href="/"
          className="rounded-full bg-brand px-6 py-3 text-[14px] font-semibold text-brand-fg shadow-brand transition active:scale-95"
        >
          Browse products
        </Link>
      </main>
    );
  }

  return (
    <main className="px-4 pb-36 pt-5">
      <div className="mb-4 flex items-baseline justify-between">
        <h1 className="text-[26px] font-bold tracking-[-0.03em]">Cart</h1>
        <button
          type="button"
          onClick={clear}
          className="text-[13px] font-medium text-tg-hint transition active:scale-95"
        >
          Clear all
        </button>
      </div>

      <ul className="space-y-2.5">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex gap-3 rounded-card border border-hairline bg-surface p-3 shadow-sm"
          >
            <Link
              href={`/product/${item.id}`}
              className="relative h-[76px] w-[76px] shrink-0 overflow-hidden rounded-xl bg-sunken"
            >
              <ProductImage
                src={item.image}
                alt={item.name}
                sizes="76px"
                size={150}
                className="object-contain p-1.5"
              />
            </Link>

            <div className="flex min-w-0 flex-1 flex-col">
              <div className="flex items-start gap-2">
                <Link
                  href={`/product/${item.id}`}
                  className="line-clamp-2 flex-1 text-[13px] font-medium leading-[1.35]"
                >
                  {item.name}
                </Link>
                <button
                  type="button"
                  onClick={() => remove(item.id)}
                  aria-label={`Remove ${item.name}`}
                  className="-mr-1 -mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-full text-tg-hint transition active:scale-90"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>

              <p className="numeric mt-0.5 text-[11px] text-tg-hint">
                {money(item.price)} each
              </p>

              <div className="mt-auto flex items-center justify-between gap-2 pt-2">
                <div className="flex h-8 items-center gap-0.5 rounded-full bg-sunken px-1">
                  <button
                    type="button"
                    onClick={() => setQty(item.id, item.qty - 1)}
                    aria-label={`Decrease quantity of ${item.name}`}
                    className="grid h-6 w-6 place-items-center rounded-full transition active:scale-90"
                  >
                    <MinusIcon className="h-3.5 w-3.5" />
                  </button>
                  <span className="numeric min-w-5 text-center text-[13px] font-bold">
                    {item.qty}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQty(item.id, item.qty + 1)}
                    aria-label={`Increase quantity of ${item.name}`}
                    className="grid h-6 w-6 place-items-center rounded-full transition active:scale-90"
                  >
                    <PlusIcon className="h-3.5 w-3.5" />
                  </button>
                </div>

                <span className="numeric text-[15px] font-bold">
                  {money(item.price * item.qty)}
                </span>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-4 space-y-2.5 rounded-card border border-hairline bg-surface p-4 shadow-sm">
        <Row label={`Subtotal · ${count} ${count === 1 ? "item" : "items"}`} value={money(total)} />
        <Row label="Shipping" value="Calculated at checkout" muted />
        <div className="h-px bg-hairline" />
        <div className="flex items-baseline justify-between">
          <span className="text-[15px] font-semibold">Total</span>
          <span className="numeric text-[22px] font-bold">{money(total)}</span>
        </div>
      </div>

      <CheckoutBar />
    </main>
  );
}

function Row({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-[13px]">
      <span className="text-tg-hint">{label}</span>
      <span className={`numeric ${muted ? "text-tg-hint" : "font-medium"}`}>{value}</span>
    </div>
  );
}

/** Fallback checkout for plain browsers, where MainButton doesn't exist. */
function CheckoutBar() {
  const { items, total, clear } = useCart();
  const [inTelegram, setInTelegram] = useState(true);

  useEffect(() => setInTelegram(Boolean(tg())), []);
  if (inTelegram) return null;

  return (
    <div className="glass fixed inset-x-0 bottom-0 z-30 border-t border-hairline px-4 pb-[max(0.875rem,env(safe-area-inset-bottom))] pt-3">
      <button
        type="button"
        onClick={() => {
          console.info("Order draft", { items, total });
          clear();
        }}
        className="mx-auto flex h-12 w-full max-w-2xl items-center justify-center gap-2 rounded-full bg-brand text-[15px] font-semibold text-brand-fg shadow-brand transition active:scale-[0.98]"
      >
        Checkout
        <span className="numeric opacity-70">·</span>
        <span className="numeric">{money(total)}</span>
      </button>
    </div>
  );
}
