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
 * same five groupings as vstorecenter.com and loads each section's children on
 * demand when its tab is tapped.
 */
export default function BottomNav() {
  const router = useRouter();
  const params = useSearchParams();
  const activeSlug = params.get("category") ?? "";

  const [open, setOpen] = useState<NavSection | null>(null);
  const [subs, setSubs] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  /** Sections already fetched — reopening a tab shouldn't hit the network. */
  const cache = useRef(new Map<string, Category[]>());

  const go = useCallback(
    (slug: string) => {
      setOpen(null);
      router.push(slug ? `/?category=${encodeURIComponent(slug)}` : "/", { scroll: true });
    },
    [router],
  );

  async function openSection(section: NavSection) {
    haptic("light");

    const cached = cache.current.get(section.slug);
    if (cached) {
      // A section with no children is just a filter — don't open an empty sheet.
      if (!cached.length) return go(section.slug);
      setSubs(cached);
      setOpen(section);
      return;
    }

    setOpen(section);
    setLoading(true);
    try {
      const response = await fetch(`/api/categories?section=${encodeURIComponent(section.slug)}`);
      const data = await response.json();
      const items: Category[] = response.ok ? (data.items ?? []) : [];
      cache.current.set(section.slug, items);
      if (!items.length) {
        setOpen(null);
        return go(section.slug);
      }
      setSubs(items);
    } catch {
      setOpen(null);
      go(section.slug); // network trouble — still let the tap do something
    } finally {
      setLoading(false);
    }
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
          items={subs}
          loading={loading}
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
            const active = open?.slug === section.slug || activeSlug === section.slug;
            return (
              <li key={section.slug} className="flex-1">
                <button
                  type="button"
                  onClick={() => openSection(section)}
                  aria-expanded={open?.slug === section.slug}
                  className={`flex w-full flex-col items-center gap-1 px-1 pb-2 pt-2.5 transition active:scale-95 ${
                    active ? "text-brand-ink" : "text-tg-hint"
                  }`}
                >
                  <Icon className="h-[22px] w-[22px]" />
                  <span className="text-[10.5px] font-semibold leading-none">{section.label}</span>
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
