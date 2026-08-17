"use client";

import { useEffect, useState } from "react";
import { useCart } from "./CartProvider";
import { money } from "@/lib/format";
import { orderMessage, shopChatLink } from "@/lib/order-message";
import { inTelegram, tg } from "@/lib/telegram";
import {
  FULFILMENTS,
  FULFILMENT_LABEL,
  type CheckoutDetails,
  type Fulfilment,
  type OrderResult,
} from "@/lib/types";

export type Placed = { order: OrderResult; details: CheckoutDetails; chatLink: string | null };

/**
 * Collects the buyer's details, creates a real WooCommerce order through
 * /api/orders, then hands off to the shop's Telegram chat with the order
 * summary pre-filled as a draft message.
 */
export default function CheckoutForm({ onPlaced }: { onPlaced: (placed: Placed) => void }) {
  const { items, total, clear } = useCart();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [fulfilment, setFulfilment] = useState<Fulfilment>("pickup");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Telegram already knows who the buyer is — prefill rather than ask twice.
  useEffect(() => {
    const user = tg()?.initDataUnsafe?.user;
    if (!user) return;
    setName((prev) => prev || [user.first_name, user.last_name].filter(Boolean).join(" "));
  }, []);

  const needsAddress = fulfilment === "delivery";

  /** Names the first missing field, or null when the form is ready to send. */
  function missingField(): string | null {
    if (!name.trim()) return "Please enter your name.";
    if (!phone.trim()) return "Please enter your phone number.";
    if (needsAddress && !address.trim()) return "Please enter a delivery address.";
    return null;
  }

  async function submit() {
    if (busy) return;

    // Say what's missing rather than leaving a dead button — a disabled
    // control with no explanation just looks broken.
    const missing = missingField();
    if (missing) {
      setError(missing);
      return;
    }

    setBusy(true);
    setError(null);

    const details: CheckoutDetails = {
      name: name.trim(),
      phone: phone.trim(),
      address: address.trim(),
      fulfilment,
      telegramUser: tg()?.initDataUnsafe?.user?.username,
    };

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...details, items: items.map((i) => ({ id: i.id, qty: i.qty })) }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data?.detail ?? data?.error ?? "We couldn't place your order.");
        return;
      }

      const order = data as OrderResult;
      const chatLink = shopChatLink(orderMessage(order, details));

      // The order exists in WooCommerce now, so the cart has served its purpose.
      clear();
      onPlaced({ order, details, chatLink });

      if (chatLink) openChat(chatLink);
    } catch {
      setError("Network problem — please check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  // Inside Telegram the native MainButton is the primary action.
  useEffect(() => {
    const app = tg();
    if (!app || !inTelegram()) return;

    const button = app.MainButton;
    button.setText(busy ? "Placing order…" : `Place order · ${money(total)}`);
    button.show();
    // Always tappable: submit() explains what's missing instead.
    if (busy) button.disable();
    else button.enable();

    button.onClick(submit);
    return () => {
      button.offClick(submit);
      button.hide();
    };
    // `submit` closes over the current form values, so re-bind when they change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, phone, address, fulfilment, busy, total, items]);

  return (
    <>
      <section className="mt-4 space-y-3 rounded-card border border-hairline bg-surface p-4 shadow-sm">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-tg-hint">
          Your details
        </h2>

        <Field label="Name" value={name} onChange={setName} placeholder="Your full name" />
        <Field
          label="Phone"
          value={phone}
          onChange={setPhone}
          placeholder="+855 12 345 678"
          type="tel"
        />

        <div>
          <span className="mb-1.5 block text-[12px] font-medium text-tg-hint">Receiving</span>
          <div className="flex gap-2">
            {FULFILMENTS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setFulfilment(option)}
                aria-pressed={fulfilment === option}
                className={`flex-1 rounded-full border px-4 py-2.5 text-[13px] font-semibold transition active:scale-95 ${
                  fulfilment === option
                    ? "border-brand bg-brand-soft text-brand-ink"
                    : "border-hairline bg-sunken text-tg-hint"
                }`}
              >
                {FULFILMENT_LABEL[option]}
              </button>
            ))}
          </div>
        </div>

        {needsAddress && (
          <Field
            label="Delivery address"
            value={address}
            onChange={setAddress}
            placeholder="House, street, district"
            multiline
          />
        )}

        {error && (
          <p className="rounded-xl bg-tg-danger/10 px-3 py-2.5 text-[13px] leading-[1.5] text-tg-danger">
            {error}
          </p>
        )}
      </section>

      <BrowserBar busy={busy} total={total} onSubmit={submit} />
    </>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  multiline,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  multiline?: boolean;
}) {
  const classes =
    "w-full rounded-xl border border-hairline bg-sunken px-3.5 py-2.5 text-[14px] outline-none transition focus:border-brand";
  return (
    <label className="block">
      <span className="mb-1.5 block text-[12px] font-medium text-tg-hint">{label}</span>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={2}
          className={`${classes} resize-none`}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={classes}
        />
      )}
    </label>
  );
}

/** Outside Telegram there's no MainButton, so the page supplies its own. */
function BrowserBar({
  busy,
  total,
  onSubmit,
}: {
  busy: boolean;
  total: number;
  onSubmit: () => void;
}) {
  const [show, setShow] = useState(false);
  useEffect(() => setShow(!inTelegram()), []);
  if (!show) return null;

  return (
    <div className="glass fixed inset-x-0 bottom-0 z-30 border-t border-hairline px-4 pb-[max(0.875rem,env(safe-area-inset-bottom))] pt-3">
      <button
        type="button"
        onClick={onSubmit}
        disabled={busy}
        className="mx-auto flex h-12 w-full max-w-2xl items-center justify-center gap-2 rounded-full bg-brand text-[15px] font-semibold text-brand-fg shadow-brand transition active:scale-[0.98] disabled:opacity-40 disabled:active:scale-100"
      >
        {busy ? "Placing order…" : "Place order"}
        {!busy && (
          <>
            <span className="numeric opacity-70">·</span>
            <span className="numeric">{money(total)}</span>
          </>
        )}
      </button>
    </div>
  );
}

/**
 * Opens the shop chat. Inside Telegram this closes the mini app and lands the
 * buyer in the conversation; in a browser a same-tab navigation is used
 * because a popup opened after an await is usually blocked.
 */
export function openChat(link: string) {
  const app = tg();
  if (app && inTelegram() && typeof app.openTelegramLink === "function") {
    app.openTelegramLink(link);
    return;
  }
  window.location.href = link;
}
