"use client";

import Link from "next/link";
import { useCart } from "./CartProvider";
import { BagIcon } from "./icons";

export default function AppHeader({ subtitle }: { subtitle?: string }) {
  const { count, ready } = useCart();

  return (
    <header className="flex items-start justify-between gap-3 px-4 pb-3 pt-5">
      <div className="min-w-0">
        <h1 className="text-[26px] font-bold leading-none tracking-[-0.03em]">
          {process.env.NEXT_PUBLIC_STORE_NAME ?? "VStore"}
        </h1>
        {subtitle && (
          <p className="mt-1.5 text-[13px] leading-tight text-tg-hint">{subtitle}</p>
        )}
      </div>

      <Link
        href="/cart"
        aria-label={`Cart, ${count} items`}
        className="relative grid h-10 w-10 shrink-0 place-items-center rounded-full border border-hairline bg-surface text-tg-text shadow-sm transition active:scale-90"
      >
        <BagIcon className="h-[18px] w-[18px]" />
        {ready && count > 0 && (
          <span className="numeric absolute -right-0.5 -top-0.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-brand px-1 text-[10px] font-bold text-brand-fg ring-2 ring-tg-secondary">
            {count > 99 ? "99+" : count}
          </span>
        )}
      </Link>
    </header>
  );
}
