"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "./CartProvider";
import { money } from "@/lib/format";
import { BagIcon } from "./icons";

/** Floating summary bar; hidden on the cart page itself and when empty. */
export default function CartBar() {
  const { count, total, ready } = useCart();
  const pathname = usePathname();

  // Product pages have their own fixed add-to-cart bar in the same position.
  const hidden =
    !ready || count === 0 || pathname === "/cart" || pathname.startsWith("/product/");

  return (
    <div
      className={`pointer-events-none fixed inset-x-0 bottom-0 z-30 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-6 transition-all duration-300 ${
        hidden ? "translate-y-6 opacity-0" : "translate-y-0 opacity-100"
      }`}
      aria-hidden={hidden}
    >
      <Link
        href="/cart"
        tabIndex={hidden ? -1 : 0}
        className="pointer-events-auto mx-auto flex max-w-2xl items-center gap-3 rounded-full bg-brand py-3 pl-4 pr-5 text-brand-fg shadow-float transition active:scale-[0.98]"
      >
        <span className="relative grid h-9 w-9 place-items-center rounded-full bg-brand-fg/10">
          <BagIcon className="h-[18px] w-[18px]" />
        </span>
        <span className="flex-1 text-left text-[14px] font-semibold leading-tight">
          View cart
          <span className="numeric block text-[11px] font-medium opacity-70">
            {count} {count === 1 ? "item" : "items"}
          </span>
        </span>
        <span className="numeric text-[16px] font-bold">{money(total)}</span>
      </Link>
    </div>
  );
}
