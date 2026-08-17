"use client";

import { useEffect, useRef, useState } from "react";
import type { Product, ProductPage } from "@/lib/types";
import ProductCard from "./ProductCard";

type Filters = { q?: string; category?: string; sort?: string };

/**
 * Renders the first server-rendered page, then appends further pages from
 * /api/products as the sentinel scrolls into view.
 */
export default function ProductFeed({
  initial,
  filters,
}: {
  initial: ProductPage;
  filters: Filters;
}) {
  const [items, setItems] = useState<Product[]>(initial.items);
  const [page, setPage] = useState(initial.page);
  const [hasMore, setHasMore] = useState(initial.hasMore);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sentinel = useRef<HTMLDivElement | null>(null);

  const key = `${filters.q ?? ""}|${filters.category ?? ""}|${filters.sort ?? ""}`;

  // A new filter set arrives as fresh server-rendered props; reset local state.
  useEffect(() => {
    setItems(initial.items);
    setPage(initial.page);
    setHasMore(initial.hasMore);
    setError(null);
  }, [key, initial]);

  useEffect(() => {
    const node = sentinel.current;
    if (!node || !hasMore || loading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) return;

        setLoading(true);
        const next = page + 1;
        const qs = new URLSearchParams({ page: String(next), perPage: String(initial.perPage) });
        if (filters.q) qs.set("q", filters.q);
        if (filters.category) qs.set("category", filters.category);
        if (filters.sort) qs.set("sort", filters.sort);

        fetch(`/api/products?${qs}`)
          .then((r) => {
            if (!r.ok) throw new Error(`Request failed (${r.status})`);
            return r.json() as Promise<ProductPage>;
          })
          .then((data) => {
            setItems((prev) => [...prev, ...data.items]);
            setPage(data.page);
            setHasMore(data.hasMore);
            setError(null);
          })
          .catch((e: Error) => setError(e.message))
          .finally(() => setLoading(false));
      },
      { rootMargin: "400px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [page, hasMore, loading, filters, initial.perPage]);

  if (!items.length) {
    return (
      <p className="px-4 py-16 text-center text-sm text-tg-hint">
        No products match your search.
      </p>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-3 px-4">
        {items.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>

      <div ref={sentinel} className="h-10" />

      {loading && <p className="pb-4 text-center text-sm text-tg-hint">Loading…</p>}
      {error && (
        <p className="pb-4 text-center text-sm text-tg-danger">Could not load more: {error}</p>
      )}
      {!hasMore && !loading && (
        <p className="pb-4 text-center text-xs text-tg-hint">That&apos;s everything.</p>
      )}
    </>
  );
}
