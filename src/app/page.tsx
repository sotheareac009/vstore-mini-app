import { getCategoryPath, getSubcategories, listProducts, parseSort } from "@/lib/products";
import { NAV_SECTIONS, sectionForSlug } from "@/lib/nav";
import { diagnose } from "@/lib/setup";
import AppHeader from "@/components/AppHeader";
import Breadcrumbs from "@/components/Breadcrumbs";
import StoreFilters from "@/components/StoreFilters";
import ProductFeed from "@/components/ProductFeed";
import SetupNotice from "@/components/SetupNotice";

export const dynamic = "force-dynamic";

const PER_PAGE = 24;

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; sort?: string }>;
}) {
  const { q, category, sort } = await searchParams;

  let products, trail, siblings, section;
  try {
    [products, trail] = await Promise.all([
      listProducts({ search: q, category, sort: parseSort(sort), page: 1, perPage: PER_PAGE }),
      getCategoryPath(category ?? ""),
    ]);

    // The chip row shows where you are *within* a section rather than every
    // category in the store, so find which of the five the current filter
    // belongs to — the trail runs root-first, so its head is that section.
    section = sectionForSlug(trail.find((c) => NAV_SECTIONS.some((s) => s.slug === c.slug))?.slug);
    siblings = section ? await getSubcategories(section.slug) : [];
  } catch (error) {
    console.error("HomePage data load failed", error);
    return <SetupNotice problem={diagnose(error)} />;
  }

  return (
    <main>
      <AppHeader subtitle="Computers, components & gaming gear" />

      {trail.length > 0 && (
        <div className="px-3 pb-1">
          <Breadcrumbs trail={trail} />
        </div>
      )}

      <StoreFilters
        categories={siblings}
        sectionSlug={section?.slug}
        sectionLabel={section?.label}
        total={products.total}
      />
      <ProductFeed
        key={`${q ?? ""}|${category ?? ""}|${sort ?? ""}`}
        initial={products}
        filters={{ q, category, sort }}
      />
    </main>
  );
}
