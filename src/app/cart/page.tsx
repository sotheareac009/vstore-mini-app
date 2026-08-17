"use client";

import Link from "next/link";
import { useState } from "react";
import ProductImage from "@/components/ProductImage";
import Breadcrumbs from "@/components/Breadcrumbs";
import { useCart } from "@/components/CartProvider";
import { money } from "@/lib/format";
import CheckoutForm, { type Placed } from "@/components/CheckoutForm";
import { openChat } from "@/lib/telegram";
import { SHOP_USERNAME } from "@/lib/order-message";
import { BagIcon, MinusIcon, PlusIcon, TrashIcon } from "@/components/icons";

export default function CartPage() {
  const { items, count, total, ready, setQty, remove, clear } = useCart();
  const [placed, setPlaced] = useState<Placed | null>(null);

  // Checked before the empty-cart branch: placing an order clears the cart,
  // so otherwise the confirmation would be replaced by "your cart is empty".
  if (placed) return <OrderPlaced placed={placed} />;

  if (!ready) {
    return (
      <CartShell>
        <div className="space-y-3 pt-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="shimmer h-24 rounded-card" />
          ))}
        </div>
      </CartShell>
    );
  }

  if (count === 0) {
    return (
      <CartShell>
        <div className="flex flex-col items-center justify-center gap-4 px-4 py-16 text-center">
          <span className="grid h-16 w-16 place-items-center rounded-full bg-surface text-tg-hint shadow-card">
            <BagIcon className="h-7 w-7" />
          </span>
          <div>
            <p className="text-[17px] font-semibold">Your cart is empty</p>
            <p className="mt-1 text-[13px] leading-relaxed text-tg-hint">
              Browse the catalogue and add something you like.
            </p>
          </div>
          <Link
            href="/"
            className="rounded-full bg-brand px-6 py-3 text-[14px] font-semibold text-brand-fg shadow-brand transition active:scale-95"
          >
            Browse products
          </Link>
        </div>
      </CartShell>
    );
  }

  return (
    <CartShell className="pb-36">
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

      <CheckoutForm onPlaced={setPlaced} />
    </CartShell>
  );
}

/**
 * Shown once WooCommerce has accepted the order. The chat opens automatically,
 * but the link is repeated here in case the client blocked the navigation or
 * the buyer came back to this screen.
 */
function OrderPlaced({ placed }: { placed: Placed }) {
  const { order, chatLink } = placed;

  return (
    <CartShell>
      <div className="flex flex-col items-center justify-center gap-4 px-4 py-14 text-center">
        <span className="grid h-16 w-16 place-items-center rounded-full bg-brand-soft text-[30px]">
          ✅
        </span>
        <div>
          <p className="text-[19px] font-bold">Order placed</p>
          <p className="numeric mt-1 text-[13px] text-tg-hint">Order No. #{order.number}</p>
          <p className="mt-3 max-w-xs text-[13px] leading-relaxed text-tg-hint">
            {chatLink
              ? `We're opening your chat with @${SHOP_USERNAME} so you can send the order details for confirmation.`
              : "Your order has been sent to the store."}
          </p>
        </div>

        {chatLink && (
          <button
            type="button"
            onClick={() => openChat(chatLink)}
            className="rounded-full bg-brand px-6 py-3 text-[14px] font-semibold text-brand-fg shadow-brand transition active:scale-95"
          >
            Send order to @{SHOP_USERNAME}
          </button>
        )}

        <Link href="/" className="text-[13px] font-medium text-tg-link">
          Continue shopping
        </Link>
      </div>
    </CartShell>
  );
}

/**
 * Shared frame for every cart state. The cart lives in localStorage, so the
 * server renders the loading state and the real contents only appear after
 * hydration — keeping the breadcrumb out here means it is present in all
 * three states rather than only once items exist.
 */
function CartShell({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <main className={`px-4 pt-3 ${className}`}>
      <div className="-mx-1 pb-2">
        <Breadcrumbs trail={[]} current="Cart" />
      </div>
      {children}
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

