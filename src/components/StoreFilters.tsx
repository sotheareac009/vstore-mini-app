"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { Category, Sort } from "@/lib/types";
import { ChevronDownIcon, CloseIcon, SearchIcon } from "./icons";

/* Kept short: a native select sizes itself to its widest option, so long
   labels here push the whole filter row past the viewport width. */
const SORT_LABELS: { value: Sort; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "popular", label: "Popular" },
  { value: "price-asc", label: "Price ↑" },
  { value: "price-desc", label: "Price ↓" },
];

/**
 * Search, sort, and the subcategory chips for whichever section is being
 * browsed. Section itself is chosen from the bottom navigation, so this row
 * stays short instead of listing all ~100 categories. All state lives in the URL.
 */
export default function StoreFilters({
  categories,
  sectionSlug,
  sectionLabel,
  total,
}: {
  /** Subcategories of the current section; empty when nothing is filtered. */
  categories: Category[];
  sectionSlug?: string;
  sectionLabel?: string;
  total: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const activeCategory = params.get("category") ?? "";
  const activeSort = (params.get("sort") ?? "newest") as Sort;
  const [term, setTerm] = useState(params.get("q") ?? "");
  const firstRender = useRef(true);

  const push = (next: URLSearchParams) => {
    startTransition(() => router.push(`${pathname}?${next.toString()}`, { scroll: false }));
  };

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    push(next);
  };

  // Debounce search so we don't hit the DB on every keystroke.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const id = setTimeout(() => {
      const next = new URLSearchParams(params.toString());
      if (term.trim()) next.set("q", term.trim());
      else next.delete("q");
      push(next);
    }, 350);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [term]);

  const sortLabel = SORT_LABELS.find((s) => s.value === activeSort)?.label ?? "Newest";

  return (
    <div className="glass sticky top-0 z-20 space-y-3 px-4 pb-3 pt-1">
      <div className="flex items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-tg-hint">
            <SearchIcon className="h-4.25 w-4.25" />
          </span>
          <input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Search products or SKU"
            aria-label="Search products"
            className="h-11 w-full rounded-full border border-hairline bg-surface pl-10 pr-9 text-[14px] shadow-sm outline-none transition placeholder:text-tg-hint focus:border-brand/50 focus:ring-4 focus:ring-brand-soft"
          />
          {term && (
            <button
              type="button"
              onClick={() => setTerm("")}
              aria-label="Clear search"
              className="absolute right-2.5 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-full bg-sunken text-tg-hint transition active:scale-90"
            >
              <CloseIcon className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Native select keeps the OS picker (good on mobile) but is styled as
            a pill so it doesn't look like a raw form control. */}
        <div className="relative shrink-0">
          <select
            value={activeSort}
            onChange={(e) => setParam("sort", e.target.value)}
            aria-label="Sort products"
            className="h-11 w-28 appearance-none truncate rounded-full border border-hairline bg-surface pl-4 pr-9 text-[13px] font-medium shadow-sm outline-none"
          >
            {SORT_LABELS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          <ChevronDownIcon className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-tg-hint" />
        </div>
      </div>

      {/* Only rendered inside a section — on the unfiltered catalogue the
          bottom navigation is the way in, so there is nothing to show here. */}
      {sectionSlug && (
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
          <Chip
            active={activeCategory === sectionSlug}
            label={`🏪 All ${sectionLabel ?? ""}`.trim()}
            onClick={() => setParam("category", sectionSlug)}
          />
          {categories.map((c) => (
            <Chip
              key={c.id}
              active={activeCategory === c.slug}
              label={c.name}
              count={c.count}
              onClick={() => setParam("category", activeCategory === c.slug ? sectionSlug : c.slug)}
            />
          ))}
        </div>
      )}

      <p className="numeric text-[11px] font-medium uppercase tracking-[0.08em] text-tg-hint">
        {isPending ? "Updating…" : `${total.toLocaleString()} products · ${sortLabel}`}
      </p>
    </div>
  );
}

function Chip({
  active,
  label,
  count,
  onClick,
}: {
  active: boolean;
  label: string;
  count?: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-[12px] font-medium transition active:scale-95 ${
        active
          ? "border-transparent bg-brand text-brand-fg shadow-brand"
          : "border-hairline bg-surface text-tg-text shadow-sm"
      }`}
    >
      {label}
      {count != null && (
        <span
          className={`numeric text-[10px] font-semibold ${
            active ? "text-brand-fg/60" : "text-tg-hint"
          }`}
        >
          {count}
        </span>
      )}
    </button>
  );
}
