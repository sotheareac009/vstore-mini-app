import { getCategoryPath, listProducts, parseSort } from "@/lib/products";
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

  let products, trail;
  try {
    [products, trail] = await Promise.all([
      listProducts({ search: q, category, sort: parseSort(sort), page: 1, perPage: PER_PAGE }),
      getCategoryPath(category ?? ""),
    ]);
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

      <StoreFilters total={products.total} />
      <ProductFeed
        key={`${q ?? ""}|${category ?? ""}|${sort ?? ""}`}
        initial={products}
        filters={{ q, category, sort }}
      />
    </main>
  );
}
