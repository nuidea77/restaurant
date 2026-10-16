"use client";

import { useState } from "react";
import { FileText } from "lucide-react";
import { Lightbox, type LightboxItem } from "@/components/lightbox";

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
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {images.map((url, i) => (
          <button
            key={url}
            onClick={() => setIndex(i)}
            className={i === 0 ? "col-span-2 row-span-2 aspect-square sm:aspect-auto" : "aspect-square"}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt={`${name} ${i + 1}`} className="h-full w-full rounded-md object-cover" />
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
            className="inline-flex items-center gap-2 rounded-md border bg-card px-3 py-2 text-sm hover:bg-muted"
          >
            <FileText className="h-4 w-4" /> Эх цэс {i + 1} ({item.type === "pdf" ? "PDF" : "Зураг"})
          </button>
        ))}
      </div>
      <Lightbox items={items} index={index} onChange={setIndex} />
    </>
  );
}
