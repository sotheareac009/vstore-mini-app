/** Placeholder card matching ProductCard's geometry, to avoid layout shift. */
export function ProductSkeleton() {
  return (
    <div className="overflow-hidden rounded-card border border-hairline bg-surface shadow-card">
      <div className="shimmer aspect-square" />
      <div className="space-y-2 p-3">
        <div className="shimmer h-3 w-full rounded-full" />
        <div className="shimmer h-3 w-2/3 rounded-full" />
        <div className="flex items-end justify-between pt-1">
          <div className="shimmer h-4 w-16 rounded-full" />
          <div className="shimmer h-8 w-8 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function ProductSkeletonGrid({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 px-4">
      {Array.from({ length: count }, (_, i) => (
        <ProductSkeleton key={i} />
      ))}
    </div>
  );
}
