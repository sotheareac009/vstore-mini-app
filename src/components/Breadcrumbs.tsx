import Link from "next/link";
import type { Crumb } from "@/lib/types";
import { ChevronRightIcon, HomeIcon } from "./icons";

/**
 * Category trail: Home / Component / Cooler / <current page>.
 *
 * Every crumb links back to the catalogue filtered by that category, so it
 * doubles as a way to widen the search rather than just showing where you are.
 * The row scrolls horizontally instead of wrapping, which keeps deep trails on
 * one line on a phone.
 */
export default function Breadcrumbs({
  trail,
  current,
}: {
  trail: Crumb[];
  /** Current page label, rendered as plain text. Omit on category pages. */
  current?: string;
}) {
  return (
    <nav aria-label="Breadcrumb" className="no-scrollbar overflow-x-auto">
      <ol className="flex w-max items-center gap-1 text-[12px] leading-none">
        <li className="flex items-center">
          <Link
            href="/"
            className="flex items-center gap-1 rounded-full px-1.5 py-1 text-tg-hint transition active:scale-95"
          >
            <HomeIcon className="h-3.5 w-3.5" />
            <span>Home</span>
          </Link>
        </li>

        {trail.map((crumb, i) => {
          const isLast = i === trail.length - 1 && !current;
          return (
            <li key={crumb.slug} className="flex items-center">
              <ChevronRightIcon className="h-3.5 w-3.5 shrink-0 text-tg-hint/50" />
              {isLast ? (
                <span aria-current="page" className="px-1.5 py-1 font-bold text-tg-text">
                  {crumb.name}
                </span>
              ) : (
                <Link
                  href={`/?category=${encodeURIComponent(crumb.slug)}`}
                  className="whitespace-nowrap px-1.5 py-1 text-tg-hint transition active:scale-95"
                >
                  {crumb.name}
                </Link>
              )}
            </li>
          );
        })}

        {current && (
          <li className="flex min-w-0 items-center">
            <ChevronRightIcon className="h-3.5 w-3.5 shrink-0 text-tg-hint/50" />
            <span
              aria-current="page"
              className="max-w-[45vw] truncate px-1.5 py-1 font-bold text-tg-text"
            >
              {current}
            </span>
          </li>
        )}
      </ol>
    </nav>
  );
}
