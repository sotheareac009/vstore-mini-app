"use client";

import { useState } from "react";
import ProductImage from "./ProductImage";

export default function ProductGallery({ images, alt }: { images: string[]; alt: string }) {
  const [active, setActive] = useState(0);

  if (!images.length) {
    return <div className="aspect-square bg-sunken" />;
  }

  return (
    <div className="bg-surface">
      <div className="relative aspect-square bg-sunken">
        <ProductImage
          src={images[active]}
          alt={alt}
          sizes="(max-width: 640px) 100vw, 640px"
          size={600}
          className="object-contain p-6"
          priority
        />

        {images.length > 1 && (
          <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5">
            {images.map((src, i) => (
              <span
                key={`dot-${src}-${i}`}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === active ? "w-5 bg-tg-text/70" : "w-1.5 bg-tg-text/25"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {images.length > 1 && (
        <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 py-3">
          {images.map((src, i) => (
            <button
              key={`${src}-${i}`}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`View image ${i + 1}`}
              aria-current={i === active}
              className={`relative h-[62px] w-[62px] shrink-0 overflow-hidden rounded-xl bg-sunken transition ${
                i === active
                  ? "ring-2 ring-brand ring-offset-2 ring-offset-surface"
                  : "opacity-60"
              }`}
            >
              <ProductImage
                src={src}
                alt=""
                sizes="62px"
                size={150}
                className="object-contain p-1.5"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
