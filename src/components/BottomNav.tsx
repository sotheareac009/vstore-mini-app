"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { NAV_SECTIONS, type NavSection } from "@/lib/nav";
import type { Category } from "@/lib/types";
import { haptic } from "@/lib/telegram";
import {
  ChipIcon,
  CloseIcon,
  GamepadIcon,
  LaptopIcon,
  TagIcon,
  WifiIcon,
} from "./icons";

const ICONS: Record<string, (p: { className?: string }) => React.ReactElement> = {
  laptop: LaptopIcon,
  chip: ChipIcon,
  gamepad: GamepadIcon,
  wifi: WifiIcon,
  tag: TagIcon,
};

/**
 * Sticky bottom navigation: five sections, each opening a sheet of its
 * subcategories.
 *
 * The catalogue has ~100 categories. Rather than list them all, this shows the
 * same five groupings as vstorecenter.com, with each section's children in a
 * sheet underneath.
 */
export default function BottomNav() {
  const router = useRouter();
  const params = useSearchParams();
  const activeSlug = params.get("category") ?? "";

  const [open, setOpen] = useState<NavSection | null>(null);
  const [tree, setTree] = useState<Record<string, Category[]> | null>(null);
  const loaded = useRef(false);

  // One request for all five sections. The nav can't highlight the right tab
  // until it knows which section owns the active category — `gaming-asus`
  // has to resolve to Laptop — so the whole map is needed up front.
  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;
    fetch("/api/categories")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d?.sections && setTree(d.sections))
      .catch(() => setTree({})); // offline: tabs still filter, sheets just stay empty
  }, []);

  /** Which tab owns the active category, section slug or any descendant of it. */
  const activeSection = NAV_SECTIONS.find(
    (s) => s.slug === activeSlug || (tree?.[s.slug] ?? []).some((c) => c.slug === activeSlug),
  );

  const go = useCallback(
    (slug: string) => {
      setOpen(null);
      router.push(slug ? `/?category=${encodeURIComponent(slug)}` : "/", { scroll: true });
    },
    [router],
  );

  function openSection(section: NavSection) {
    haptic("light");
    // A section with no children is just a filter — don't open an empty sheet.
    if (tree && !(tree[section.slug] ?? []).length) return go(section.slug);
    setOpen(section);
  }

  // Escape closes the sheet, and the page behind it shouldn't scroll.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(null);
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open]);

  return (
    <>
      {open && (
        <SubcategorySheet
          section={open}
          items={tree?.[open.slug] ?? []}
          loading={tree === null}
          activeSlug={activeSlug}
          onPick={go}
          onClose={() => setOpen(null)}
        />
      )}

      <nav
        aria-label="Product sections"
        className="glass fixed inset-x-0 bottom-0 z-40 border-t border-hairline pb-[env(safe-area-inset-bottom)]"
      >
        <ul className="mx-auto flex max-w-2xl">
          {NAV_SECTIONS.map((section) => {
            const Icon = ICONS[section.icon] ?? LaptopIcon;
            const active = open?.slug === section.slug || activeSection?.slug === section.slug;
            return (
              <li key={section.slug} className="flex-1">
                <button
                  type="button"
                  onClick={() => openSection(section)}
                  aria-expanded={open?.slug === section.slug}
                  aria-current={active ? "page" : undefined}
                  className={`relative flex w-full flex-col items-center gap-1 px-1 pb-2 pt-2.5 transition active:scale-95 ${
                    active ? "text-brand-ink" : "text-tg-hint"
                  }`}
                >
                  {/* Colour alone is a weak signal at this size, so the active
                      tab also gets a bar above it and a tinted icon well. */}
                  <span
                    aria-hidden="true"
                    className={`absolute inset-x-3 top-0 h-[2.5px] rounded-full transition ${
                      active ? "bg-brand" : "bg-transparent"
                    }`}
                  />
                  <span
                    className={`grid h-7 w-11 place-items-center rounded-full transition ${
                      active ? "bg-brand-soft" : "bg-transparent"
                    }`}
                  >
                    <Icon className="h-5.25 w-5.25" />
                  </span>
                  <span
                    className={`text-[10.5px] leading-none ${active ? "font-bold" : "font-semibold"}`}
                  >
                    {section.label}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}

/** Bottom sheet listing one section's subcategories. */
function SubcategorySheet({
  section,
  items,
  loading,
  activeSlug,
  onPick,
  onClose,
}: {
  section: NavSection;
  items: Category[];
  loading: boolean;
  activeSlug: string;
  onPick: (slug: string) => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={section.label}>
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 h-full w-full bg-black/40 backdrop-blur-[2px]"
      />

      <div className="absolute inset-x-0 bottom-0 max-h-[72vh] overflow-y-auto rounded-t-[22px] border-t border-hairline bg-tg-bg pb-[max(1rem,env(safe-area-inset-bottom))] shadow-float">
        <div className="sticky top-0 z-10 bg-tg-bg px-4 pb-2 pt-3">
          <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-hairline-strong" />
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-[17px] font-bold">{section.label}</h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="grid h-8 w-8 place-items-center rounded-full bg-sunken text-tg-hint transition active:scale-90"
            >
              <CloseIcon className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="px-4 pt-1">
          <button
            type="button"
            onClick={() => onPick(section.slug)}
            className={`mb-2 flex w-full items-center justify-between gap-3 rounded-card border px-4 py-3 text-left transition active:scale-[0.99] ${
              activeSlug === section.slug
                ? "border-brand bg-brand-soft"
                : "border-hairline bg-surface shadow-sm"
            }`}
          >
            <span className="text-[14px] font-semibold">🏪 All {section.label}</span>
          </button>

          {loading ? (
            <div className="space-y-2">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="shimmer h-12 rounded-card" />
              ))}
            </div>
          ) : (
            <ul className="space-y-2">
              {items.map((item) => {
                const active = activeSlug === item.slug;
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => onPick(item.slug)}
                      className={`flex w-full items-center justify-between gap-3 rounded-card border px-4 py-3 text-left transition active:scale-[0.99] ${
                        active
                          ? "border-brand bg-brand-soft"
                          : "border-hairline bg-surface shadow-sm"
                      }`}
                    >
                      <span className="min-w-0 flex-1 truncate text-[14px] font-medium">
                        {item.name}
                      </span>
                      <span className="numeric shrink-0 rounded-full bg-sunken px-2 py-0.5 text-[11px] font-semibold text-tg-hint">
                        {item.count}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
