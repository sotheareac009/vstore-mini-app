import { getCategories, listProducts, parseSort } from "@/lib/products";
import StoreFilters from "@/components/StoreFilters";
import ProductFeed from "@/components/ProductFeed";

export const dynamic = "force-dynamic";

const PER_PAGE = 24;

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; sort?: string }>;
}) {
  const { q, category, sort } = await searchParams;

  const [products, categories] = await Promise.all([
    listProducts({ search: q, category, sort: parseSort(sort), page: 1, perPage: PER_PAGE }),
    getCategories(20),
  ]);

  return (
    <main>
      <header className="px-4 pt-4">
        <h1 className="text-xl font-bold">{process.env.NEXT_PUBLIC_STORE_NAME ?? "VStore"}</h1>
        <p className="text-sm text-tg-hint">Tap a product to see details</p>
      </header>

      <StoreFilters categories={categories} total={products.total} />

      <ProductFeed
        key={`${q ?? ""}|${category ?? ""}|${sort ?? ""}`}
        initial={products}
        filters={{ q, category, sort }}
      />
    </main>
  );
}
