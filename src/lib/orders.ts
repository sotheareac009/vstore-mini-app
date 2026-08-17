import "server-only";
import { SetupError, showsDetail } from "./setup";
import { FULFILMENT_LABEL, type OrderRequest, type OrderResult } from "./types";

/**
 * Creates real WooCommerce orders over the REST API, so they appear in
 * wp-admin exactly like any other order — with stock reduction, order emails
 * and every Woo hook intact. Writing the order tables directly would skip all
 * of that, so this is deliberately an HTTP call rather than SQL.
 */

const STORE_URL = (process.env.WC_STORE_URL ?? "").replace(/\/$/, "");
const KEY = process.env.WC_CONSUMER_KEY ?? "";
const SECRET = process.env.WC_CONSUMER_SECRET ?? "";

/** Woo returns prices as strings; keep them verbatim for display. */
type WooOrder = {
  id: number;
  number: string;
  total: string;
  currency_symbol?: string;
  line_items: { name: string; quantity: number; total: string }[];
};

function requireConfig() {
  const missing = [
    ["WC_STORE_URL", STORE_URL],
    ["WC_CONSUMER_KEY", KEY],
    ["WC_CONSUMER_SECRET", SECRET],
  ]
    .filter(([, value]) => !value)
    .map(([name]) => name as string);

  if (!missing.length) return;

  throw new SetupError({
    title: "Ordering is not configured",
    summary:
      "Checkout needs WooCommerce REST API credentials so it can create the order in WordPress. " +
      `${missing.length} ${missing.length === 1 ? "variable is" : "variables are"} missing.`,
    variables: missing,
    steps: [
      "In WordPress: WooCommerce → Settings → Advanced → REST API → Add key.",
      'Give it Read/Write permission, then copy the Consumer key (ck_…) and Consumer secret (cs_…) — the secret is shown only once.',
      "Add WC_CONSUMER_KEY and WC_CONSUMER_SECRET in Vercel → Settings → Environment Variables.",
      "Set WC_STORE_URL to your store's base URL, e.g. https://vstorecenter.com (no trailing slash).",
      "Redeploy so the new variables are picked up.",
    ],
    detailed: showsDetail(),
  });
}

/**
 * Sends the cart to WooCommerce.
 *
 * Only product ids and quantities are forwarded: Woo prices each line from the
 * product itself, so a tampered client can't set its own prices.
 */
export async function createOrder(order: OrderRequest): Promise<OrderResult> {
  requireConfig();

  const [firstName, ...rest] = order.name.trim().split(/\s+/);
  const pickup = order.fulfilment === "pickup";

  const noteLines = [
    `Receiving: ${FULFILMENT_LABEL[order.fulfilment]}`,
    order.telegramUser ? `Telegram: @${order.telegramUser}` : null,
    "Placed from the Telegram mini app.",
  ].filter(Boolean);

  const body = {
    payment_method: "cod",
    payment_method_title: pickup ? "Pay on pick up" : "Cash on delivery",
    status: "pending",
    billing: {
      first_name: firstName ?? "",
      last_name: rest.join(" "),
      phone: order.phone.trim(),
      address_1: order.address.trim(),
    },
    shipping: {
      first_name: firstName ?? "",
      last_name: rest.join(" "),
      address_1: pickup ? "" : order.address.trim(),
    },
    line_items: order.items.map((i) => ({ product_id: i.id, quantity: i.qty })),
    customer_note: noteLines.join(" · "),
  };

  const response = await fetch(`${STORE_URL}/wp-json/wc/v3/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // Woo accepts key/secret as HTTP Basic over HTTPS.
      Authorization: `Basic ${Buffer.from(`${KEY}:${SECRET}`).toString("base64")}`,
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(
      `WooCommerce rejected the order (HTTP ${response.status}): ${detail.slice(0, 300)}`,
    );
  }

  const created = (await response.json()) as WooOrder;
  return {
    number: created.number ?? String(created.id),
    total: created.total,
    currencySymbol: created.currency_symbol ?? "$",
    lines: (created.line_items ?? []).map((l) => ({
      name: l.name,
      qty: l.quantity,
      total: l.total,
    })),
  };
}
