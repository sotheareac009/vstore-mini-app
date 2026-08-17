"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { imageCandidates, type ImageSize } from "@/lib/images";

/**
 * Product image that walks the candidate list from `imageCandidates` on every
 * load error — resized variant, then original, then the fallback host — and
 * falls back to a neutral tile if none of them load.
 */
export default function ProductImage({
  src,
  alt,
  sizes,
  size = 300,
  className = "object-contain p-2",
  priority,
}: {
  src: string | null;
  alt: string;
  sizes: string;
  size?: ImageSize;
  className?: string;
  priority?: boolean;
}) {
  const candidates = useMemo(() => imageCandidates(src, size), [src, size]);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => setAttempt(0), [candidates]);

  const current = candidates[attempt];

  if (!current) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-tg-secondary text-[10px] text-tg-hint">
        No image
      </div>
    );
  }

  return (
    <Image
      key={current}
      src={current}
      alt={alt}
      fill
      sizes={sizes}
      className={className}
      priority={priority}
      onError={() => setAttempt((n) => n + 1)}
      unoptimized
    />
  );
}
