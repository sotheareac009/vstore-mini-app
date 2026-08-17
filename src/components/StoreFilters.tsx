"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { Category, Sort } from "@/lib/types";

const SORT_LABELS: { value: Sort; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "popular", label: "Popular" },
  { value: "price-asc", label: "Price ↑" },
  { value: "price-desc", label: "Price ↓" },
];

/** Search box, category chips and sort selector — all driven through the URL. */
export default function StoreFilters({
  categories,
  total,
}: {
  categories: Category[];
  total: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [, startTransition] = useTransition();

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

  return (
    <div className="sticky top-0 z-20 space-y-3 bg-tg-bg/95 px-4 pb-3 pt-3 backdrop-blur">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Search products or SKU…"
            className="w-full rounded-xl bg-tg-secondary py-2.5 pl-9 pr-8 text-sm outline-none placeholder:text-tg-hint"
          />
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-tg-hint">
            ⌕
          </span>
          {term && (
            <button
              type="button"
              onClick={() => setTerm("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 px-1 text-tg-hint"
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        <select
          value={activeSort}
          onChange={(e) => setParam("sort", e.target.value)}
          className="rounded-xl bg-tg-secondary px-2 py-2.5 text-sm outline-none"
          aria-label="Sort products"
        >
          {SORT_LABELS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
        <Chip
          active={!activeCategory}
          label="All"
          onClick={() => setParam("category", "")}
        />
        {categories.map((c) => (
          <Chip
            key={c.id}
            active={activeCategory === c.slug}
            label={`${c.name} (${c.count})`}
            onClick={() => setParam("category", activeCategory === c.slug ? "" : c.slug)}
          />
        ))}
      </div>

      <p className="text-xs text-tg-hint">{total} products</p>
    </div>
  );
}

function Chip({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition ${
        active ? "bg-tg-button text-tg-button-text" : "bg-tg-secondary text-tg-text"
      }`}
    >
      {label}
    </button>
  );
}
