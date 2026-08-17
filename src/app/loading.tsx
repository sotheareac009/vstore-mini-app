import { ProductSkeletonGrid } from "@/components/ProductSkeleton";

export default function Loading() {
  return (
    <div className="pt-5">
      <div className="flex items-center justify-between px-4 pb-4">
        <div className="shimmer h-7 w-32 rounded-full" />
        <div className="shimmer h-10 w-10 rounded-full" />
      </div>
      <div className="flex gap-2 px-4 pb-3">
        <div className="shimmer h-11 flex-1 rounded-full" />
        <div className="shimmer h-11 w-28 rounded-full" />
      </div>
      <ProductSkeletonGrid count={6} />
    </div>
  );
}
