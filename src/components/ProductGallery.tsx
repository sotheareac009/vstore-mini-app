"use client";

import { useState } from "react";
import ProductImage from "./ProductImage";

export default function ProductGallery({ images, alt }: { images: string[]; alt: string }) {
  const [active, setActive] = useState(0);

  if (!images.length) {
    return (
      <div className="flex aspect-square items-center justify-center bg-tg-secondary text-sm text-tg-hint">
        No image
      </div>
    );
  }

  return (
    <div>
      <div className="relative aspect-square bg-white">
        <ProductImage
          src={images[active]}
          alt={alt}
          sizes="(max-width: 640px) 100vw, 640px"
          size={600}
          className="object-contain p-3"
          priority
        />
      </div>

      {images.length > 1 && (
        <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 py-3">
          {images.map((src, i) => (
            <button
              key={`${src}-${i}`}
              type="button"
              onClick={() => setActive(i)}
              className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-white ring-2 transition ${
                i === active ? "ring-tg-button" : "ring-transparent"
              }`}
              aria-label={`View image ${i + 1}`}
            >
              <ProductImage
                src={src}
                alt=""
                sizes="64px"
                size={150}
                className="object-contain p-1"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
