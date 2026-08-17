import { NextResponse } from "next/server";
import { createOrder } from "@/lib/orders";
import { diagnose } from "@/lib/setup";
import { FULFILMENTS, type Fulfilment, type OrderRequest } from "@/lib/types";

export const dynamic = "force-dynamic";

/** Trim and cap a free-text field so nothing oversized reaches WooCommerce. */
function text(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const body = payload as Partial<OrderRequest>;

  const items = Array.isArray(body.items)
    ? body.items
        .map((i) => ({ id: Number(i?.id), qty: Math.floor(Number(i?.qty)) }))
        .filter((i) => Number.isInteger(i.id) && i.id > 0 && i.qty > 0 && i.qty <= 999)
    : [];

  const name = text(body.name, 120);
  const phone = text(body.phone, 40);
  const fulfilment: Fulfilment = FULFILMENTS.includes(body.fulfilment as Fulfilment)
    ? (body.fulfilment as Fulfilment)
    : "pickup";
  const address = text(body.address, 400);

  if (!items.length) {
    return NextResponse.json({ error: "Your cart is empty." }, { status: 400 });
  }
  if (!name) {
    return NextResponse.json({ error: "Please enter your name." }, { status: 400 });
  }
  if (!phone) {
    return NextResponse.json({ error: "Please enter your phone number." }, { status: 400 });
  }
  if (fulfilment === "delivery" && !address) {
    return NextResponse.json(
      { error: "Please enter a delivery address." },
      { status: 400 },
    );
  }

  try {
    const order = await createOrder({
      items,
      name,
      phone,
      address,
      fulfilment,
      telegramUser: text(body.telegramUser, 60).replace(/^@/, "") || undefined,
    });
    return NextResponse.json(order);
  } catch (error) {
    console.error("POST /api/orders failed", error);
    const problem = diagnose(error);
    return NextResponse.json(
      problem.detailed
        ? { error: problem.title, detail: problem.summary, variables: problem.variables }
        : { error: "We couldn't place your order. Please try again." },
      { status: 500 },
    );
  }
}
