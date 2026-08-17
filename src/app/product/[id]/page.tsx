import Link from "next/link";
import { notFound } from "next/navigation";
import { getProduct, getProductCategoryPath } from "@/lib/products";
import { diagnose } from "@/lib/setup";
import Breadcrumbs from "@/components/Breadcrumbs";
import ProductGallery from "@/components/ProductGallery";
import AddToCartPanel from "@/components/AddToCartPanel";
import SetupNotice from "@/components/SetupNotice";
import { money } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const productId = Number(id);
  if (!Number.isInteger(productId) || productId <= 0) notFound();

  // Only the data call is wrapped — notFound() below throws a control-flow
  // signal that must reach Next, not the setup notice.
  let product;
  try {
    product = await getProduct(productId);
  } catch (error) {
    console.error("ProductPage data load failed", error);
    return <SetupNotice problem={diagnose(error)} />;
  }
  if (!product) notFound();

  const trail = await getProductCategoryPath(product.categories.map((c) => c.id));

  const discount =
    product.regularPrice && product.regularPrice > product.price
      ? Math.round((1 - product.price / product.regularPrice) * 100)
      : 0;

  return (
    <main className="pb-32">
      <div className="px-3 py-2.5">
        <Breadcrumbs trail={trail} current={product.name} />
      </div>

      <ProductGallery images={product.gallery} alt={product.name} />

      <section className="mt-3 space-y-4 border-y border-hairline bg-surface px-4 py-5">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
              product.inStock
                ? "bg-brand-soft text-brand-ink"
                : "bg-tg-danger/10 text-tg-danger"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                product.inStock ? "bg-brand-ink" : "bg-tg-danger"
              }`}
            />
            {product.inStock
              ? product.stockQuantity != null
                ? `${product.stockQuantity} in stock`
                : "In stock"
              : "Out of stock"}
          </span>
          {product.sku && (
            <span className="numeric text-[11px] text-tg-hint">SKU {product.sku}</span>
          )}
        </div>

        <h1 className="text-[22px] font-bold leading-[1.25]">{product.name}</h1>

        <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
          <span className="numeric text-[30px] font-bold leading-none">
            {money(product.price)}
          </span>
          {product.regularPrice && (
            <>
              <span className="numeric text-[15px] text-tg-hint line-through">
                {money(product.regularPrice)}
              </span>
              <span className="numeric rounded-full bg-brand px-2 py-0.5 text-[11px] font-bold text-brand-fg">
                Save {discount}%
              </span>
            </>
          )}
        </div>
      </section>

      {product.categories.length > 0 && (
        <section className="px-4 py-5">
          <h2 className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-tg-hint">
            Categories
          </h2>
          <div className="flex flex-wrap gap-2">
            {product.categories.map((c) => (
              <Link
                key={c.id}
                href={`/?category=${encodeURIComponent(c.slug)}`}
                className="rounded-full border border-hairline bg-surface px-3.5 py-2 text-[13px] font-medium shadow-sm transition active:scale-95"
              >
                {c.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      {product.blocks.length > 0 && (
        <section className="px-4 pb-6">
          <h2 className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-tg-hint">
            Details
          </h2>
          <div className="space-y-4 rounded-card border border-hairline bg-surface p-4 shadow-sm">
            {product.blocks.map((block, i) => {
              if (block.type === "specs") {
                return (
                  <dl
                    key={i}
                    className="divide-y divide-hairline overflow-hidden rounded-xl bg-sunken"
                  >
                    {block.items.map((spec) => (
                      <div key={spec.label} className="flex gap-3 px-3 py-2.5">
                        <dt className="w-28 shrink-0 text-[12.5px] text-tg-hint">{spec.label}</dt>
                        <dd className="min-w-0 flex-1 text-[13.5px] font-medium leading-[1.45]">
                          {spec.value}
                        </dd>
                      </div>
                    ))}
                  </dl>
                );
              }

              if (block.type === "heading") {
                return (
                  <h3 key={i} className="text-[13px] font-bold text-brand-ink">
                    {block.text}
                  </h3>
                );
              }

              if (block.type === "list") {
                return (
                  <ul key={i} className="space-y-1.5">
                    {block.items.map((item, j) => (
                      <li key={j} className="flex gap-2 text-[13.5px] leading-[1.55]">
                        <span aria-hidden="true" className="mt-1.75 h-1 w-1 shrink-0 rounded-full bg-brand" />
                        <span className="text-tg-text/85">{item}</span>
                      </li>
                    ))}
                  </ul>
                );
              }

              return (
                <p key={i} className="text-[13.5px] leading-[1.65] text-tg-text/85">
                  {block.text}
                </p>
              );
            })}
          </div>
        </section>
      )}

      <AddToCartPanel product={product} />
    </main>
  );
}
