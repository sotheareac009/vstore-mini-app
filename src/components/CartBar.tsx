"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "./CartProvider";
import { money } from "@/lib/format";

/** Floating summary bar; hidden on the cart page itself and when empty. */
export default function CartBar() {
  const { count, total, ready } = useCart();
  const pathname = usePathname();

  if (!ready || count === 0 || pathname === "/cart") return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <Link
        href="/cart"
        className="mx-auto flex max-w-2xl items-center justify-between rounded-2xl bg-tg-button px-4 py-3 text-tg-button-text shadow-lg transition active:scale-[0.99]"
      >
        <span className="text-sm font-semibold">
          View cart · {count} {count === 1 ? "item" : "items"}
        </span>
        <span className="text-sm font-bold">{money(total)}</span>
      </Link>
    </div>
  );
}
