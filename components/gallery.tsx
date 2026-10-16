"use client";

import { useState } from "react";
import { FileText } from "lucide-react";
import { Lightbox, type LightboxItem } from "@/components/lightbox";
import { buttonVariants } from "@/components/ui/button-variants";

export function fileType(url: string): LightboxItem["type"] {
  return /\.pdf($|\?)/i.test(url) ? "pdf" : "image";
}

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

/** Эх PDF болон зургийн цэсийг бүтнээр нь харах. */
export function SourceFiles({ urls }: { urls: string[] }) {
  const [index, setIndex] = useState<number | null>(null);
  if (!urls.length) return null;
  const items = urls.map((url) => ({ url, type: fileType(url) }));

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {items.map((item, i) => (
          <button
            key={item.url}
            onClick={() => setIndex(i)}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            <FileText className="h-4 w-4" /> Эх цэс {i + 1} ({item.type === "pdf" ? "PDF" : "Зураг"})
          </button>
        ))}
      </div>
      <Lightbox items={items} index={index} onChange={setIndex} />
    </>
  );
}
