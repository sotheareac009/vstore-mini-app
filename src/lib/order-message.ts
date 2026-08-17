import { FULFILMENT_LABEL, type CheckoutDetails, type OrderResult } from "./types";

const RULE = "━━━━━━━━━━━━━━━";

const STORE_NAME = process.env.NEXT_PUBLIC_STORE_NAME ?? "VStore";
/** Shop account the order message is sent to, without the leading @. */
const SHOP_USER = (process.env.NEXT_PUBLIC_TELEGRAM_SHOP ?? "").replace(/^@/, "");

/** The message the buyer sends to the shop after ordering. */
export function orderMessage(order: OrderResult, details: CheckoutDetails): string {
  const price = (value: string) => `${order.currencySymbol}${value}`;
  const delivering = details.fulfilment === "delivery";

  return [
    "Hello 👋 I have just placed an order on your website.",
    "Could you please check and confirm my order? Thank you!",
    RULE,
    `🧾 Order No. #${order.number}`,
    `🏬 ${STORE_NAME}`,
    RULE,
    `👤 Name: ${details.name}`,
    `📞 Phone: ${details.phone}`,
    ...(delivering && details.address ? [`📍 Address: ${details.address}`] : []),
    RULE,
    "🛍 My order",
    ...order.lines.map((l) => `   • ${l.name}  ×${l.qty}  —  ${price(l.total)}`),
    RULE,
    `🏬 Receiving: ${FULFILMENT_LABEL[details.fulfilment]}`,
    RULE,
    `💰 Total: ${price(order.total)}`,
    RULE,
    "Please let me know the next step. 🙏",
  ].join("\n");
}

/**
 * Deep link that opens the shop's chat with the message pre-filled.
 * `t.me/<username>?text=<draft>` is Telegram's documented draft-text link.
 */
export function shopChatLink(message: string): string | null {
  if (!SHOP_USER) return null;
  return `https://t.me/${SHOP_USER}?text=${encodeURIComponent(message)}`;
}

export const SHOP_USERNAME = SHOP_USER;
