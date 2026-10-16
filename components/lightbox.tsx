"use client";

import { useCallback, useEffect } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

export type LightboxItem = { url: string; type: "image" | "pdf" };

export function Lightbox({
  items,
  index,
  onChange,
}: {
  items: LightboxItem[];
  index: number | null;
  onChange: (index: number | null) => void;
}) {
  const close = useCallback(() => onChange(null), [onChange]);
  const step = useCallback(
    (d: number) => index !== null && onChange((index + d + items.length) % items.length),
    [index, items.length, onChange],
  );

  useEffect(() => {
    if (index === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, close, step]);

  if (index === null || !items[index]) return null;
  const item = items[index];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4" onClick={close} role="dialog" aria-modal>
      <button className="absolute right-4 top-4 text-white" onClick={close} aria-label="Хаах">
        <X className="h-8 w-8" />
      </button>
      {items.length > 1 && (
        <>
          <button
            className="absolute left-2 text-white sm:left-6"
            onClick={(e) => {
              e.stopPropagation();
              step(-1);
            }}
            aria-label="Өмнөх"
          >
            <ChevronLeft className="h-10 w-10" />
          </button>
          <button
            className="absolute right-2 text-white sm:right-6"
            onClick={(e) => {
              e.stopPropagation();
              step(1);
            }}
            aria-label="Дараах"
          >
            <ChevronRight className="h-10 w-10" />
          </button>
        </>
      )}
      <div className="flex h-full w-full max-w-5xl items-center justify-center" onClick={(e) => e.stopPropagation()}>
        {item.type === "pdf" ? (
          <iframe src={item.url} title="PDF цэс" className="h-[85vh] w-full rounded bg-white" />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.url} alt="" className="max-h-[85vh] max-w-full object-contain" />
        )}
      </div>
    </div>
  );
}
