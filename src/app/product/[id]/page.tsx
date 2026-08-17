import Link from "next/link";
import { notFound } from "next/navigation";
import { getProduct } from "@/lib/products";
import ProductGallery from "@/components/ProductGallery";
import AddToCartPanel from "@/components/AddToCartPanel";
import { money } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const productId = Number(id);
  if (!Number.isInteger(productId) || productId <= 0) notFound();

  const product = await getProduct(productId);
  if (!product) notFound();

  return (
    <main className="pb-8">
      <ProductGallery images={product.gallery} alt={product.name} />

      <div className="space-y-4 px-4 pt-4">
        <div>
          <h1 className="text-lg font-bold leading-snug">{product.name}</h1>
          {product.sku && <p className="mt-1 text-xs text-tg-hint">SKU: {product.sku}</p>}
        </div>

        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold">{money(product.price)}</span>
          {product.regularPrice && (
            <span className="text-sm text-tg-hint line-through">
              {money(product.regularPrice)}
            </span>
          )}
          <span
            className={`ml-auto text-xs font-medium ${
              product.inStock ? "text-tg-link" : "text-tg-danger"
            }`}
          >
            {product.inStock
              ? product.stockQuantity != null
                ? `${product.stockQuantity} in stock`
                : "In stock"
              : "Out of stock"}
          </span>
        </div>

        {product.categories.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {product.categories.map((c) => (
              <Link
                key={c.id}
                href={`/?category=${encodeURIComponent(c.slug)}`}
                className="rounded-full bg-tg-secondary px-3 py-1 text-xs"
              >
                {c.name}
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="pt-4">
        <AddToCartPanel product={product} />
      </div>

      {product.description && (
        <section className="mt-6 px-4">
          <h2 className="mb-2 text-sm font-semibold">Description</h2>
          <p className="whitespace-pre-line text-sm leading-relaxed text-tg-hint">
            {product.description}
          </p>
        </section>
      )}
    </main>
  );
}
