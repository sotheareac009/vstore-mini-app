"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import ProductImage from "@/components/ProductImage";
import { useCart } from "@/components/CartProvider";
import { money } from "@/lib/format";
import { tg } from "@/lib/telegram";

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
    return <p className="px-4 py-16 text-center text-sm text-tg-hint">Loading cart…</p>;
  }

  if (count === 0) {
    return (
      <main className="flex flex-col items-center justify-center gap-4 px-4 py-24 text-center">
        <p className="text-4xl">🛒</p>
        <p className="text-sm text-tg-hint">
          {sent ? "Order sent. Check your chat!" : "Your cart is empty."}
        </p>
        <Link
          href="/"
          className="rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-brand-fg"
        >
          Browse products
        </Link>
      </main>
    );
  }

  return (
    <main className="px-4 py-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">Cart</h1>
        <button type="button" onClick={clear} className="text-xs text-tg-danger">
          Clear all
        </button>
      </div>

      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item.id} className="flex gap-3 rounded-2xl bg-tg-secondary p-3">
            <Link
              href={`/product/${item.id}`}
              className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-white"
            >
              <ProductImage
                src={item.image}
                alt={item.name}
                sizes="80px"
                size={150}
                className="object-contain p-1"
              />
            </Link>

            <div className="flex min-w-0 flex-1 flex-col">
              <Link href={`/product/${item.id}`} className="line-clamp-2 text-sm font-medium">
                {item.name}
              </Link>
              <p className="mt-0.5 text-xs text-tg-hint">{money(item.price)} each</p>

              <div className="mt-auto flex items-center gap-2 pt-2">
                <div className="flex items-center overflow-hidden rounded-lg bg-tg-bg">
                  <button
                    type="button"
                    onClick={() => setQty(item.id, item.qty - 1)}
                    className="px-3 py-1 text-base leading-none"
                    aria-label={`Decrease quantity of ${item.name}`}
                  >
                    −
                  </button>
                  <span className="min-w-6 text-center text-sm font-semibold">{item.qty}</span>
                  <button
                    type="button"
                    onClick={() => setQty(item.id, item.qty + 1)}
                    className="px-3 py-1 text-base leading-none"
                    aria-label={`Increase quantity of ${item.name}`}
                  >
                    +
                  </button>
                </div>

                <span className="ml-auto text-sm font-bold">
                  {money(item.price * item.qty)}
                </span>
                <button
                  type="button"
                  onClick={() => remove(item.id)}
                  className="text-xs text-tg-danger"
                >
                  Remove
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-5 space-y-2 rounded-2xl bg-tg-secondary p-4">
        <Row label={`Subtotal (${count} items)`} value={money(total)} />
        <Row label="Shipping" value="Calculated at checkout" muted />
        <div className="my-2 h-px bg-tg-bg" />
        <div className="flex justify-between text-base font-bold">
          <span>Total</span>
          <span>{money(total)}</span>
        </div>
      </div>

      <CheckoutButton />
    </main>
  );
}

function Row({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-tg-hint">{label}</span>
      <span className={muted ? "text-tg-hint" : ""}>{value}</span>
    </div>
  );
}

/** Fallback checkout for plain browsers, where MainButton doesn't exist. */
function CheckoutButton() {
  const { items, total, clear } = useCart();
  const [done, setDone] = useState(false);
  const [inTelegram, setInTelegram] = useState(true);

  useEffect(() => setInTelegram(Boolean(tg())), []);
  if (inTelegram) return null;

  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={() => {
          console.info("Order draft", { items, total });
          setDone(true);
          clear();
        }}
        className="w-full rounded-2xl bg-brand py-3 text-sm font-semibold text-brand-fg"
      >
        Checkout · {money(total)}
      </button>
      {done && (
        <p className="mt-2 text-center text-xs text-tg-hint">
          Open this page inside Telegram to send the order to the bot.
        </p>
      )}
    </div>
  );
}
