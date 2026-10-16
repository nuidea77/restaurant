"use client";

import { useState } from "react";
import { Lightbox } from "@/components/lightbox";

/** Заалны/хоолны зургийн цомог. */
export function Gallery({ images, name }: { images: string[]; name: string }) {
  const [index, setIndex] = useState<number | null>(null);
  if (!images.length) return null;
  const items = images.map((url) => ({ url, type: "image" as const }));

  return (
    <>
      <div className={images.length <= 2 ? `grid gap-3 ${images.length === 2 ? "sm:grid-cols-2" : ""}` : "grid grid-cols-2 gap-3 sm:grid-cols-4"}>
        {images.map((url, i) => (
          <button
            key={url}
            onClick={() => setIndex(i)}
            className={
              images.length <= 2
                ? images.length === 1
                  ? "aspect-[21/9]"
                  : "aspect-video"
                : i === 0
                  ? "col-span-2 row-span-2 aspect-square sm:aspect-auto"
                  : "aspect-square"
            }
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt={`${name} ${i + 1}`} className="h-full w-full rounded-xl border object-cover transition hover:opacity-90" />
          </button>
        ))}
      </div>
      <Lightbox items={items} index={index} onChange={setIndex} />
    </>
  );
}
