"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "./CartProvider";
import { BagIcon } from "./icons";

export default function AppHeader({ subtitle }: { subtitle?: string }) {
  const { count, ready } = useCart();

  return (
    <header className="flex items-start justify-between gap-3 px-4 pb-3 pt-5">
      <div className="flex min-w-0 items-center gap-2.5">
        {/* The source file is 512x512; next/image serves it down to the size
            actually used so the 430KB original never reaches the phone. */}
        <Image
          src="/assets/vstore_logo.png"
          alt=""
          width={40}
          height={40}
          priority
          className="h-10 w-10 shrink-0 rounded-xl object-contain"
        />

        <div className="min-w-0">
          <h1 className="truncate text-[26px] font-bold leading-none tracking-[-0.03em]">
            {process.env.NEXT_PUBLIC_STORE_NAME ?? "VStore"}
          </h1>
          {subtitle && (
            <p className="mt-1.5 text-[13px] leading-tight text-tg-hint">{subtitle}</p>
          )}
        </div>
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
