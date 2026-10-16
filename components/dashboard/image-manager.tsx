"use client";

import { useState, useTransition } from "react";
import { X } from "lucide-react";
import { setImages } from "@/app/dashboard/actions";
import { IMAGE_MIME_TYPES } from "@/lib/constants";
import { directUpload } from "@/lib/upload";
import { buttonVariants } from "@/components/ui/button-variants";

export function ImageManager({ restaurantId, userId, images }: { restaurantId: string; userId: string; images: string[] }) {
  const [list, setList] = useState(images);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [, startTransition] = useTransition();

  async function persist(next: string[]) {
    const res = await setImages(restaurantId, next);
    if (!res.ok) return setError(res.error);
    setList(next);
  }

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    setError(null);
    try {
      const urls: string[] = [];
      for (const file of Array.from(files)) urls.push(await directUpload(file, "images", userId));
      await persist([...list, ...urls]);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
        {list.map((url) => (
          <div key={url} className="relative aspect-square">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="" className="h-full w-full rounded-lg border object-cover" />
            <button
              className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white"
              onClick={() => startTransition(() => persist(list.filter((u) => u !== url)))}
              aria-label="Устгах"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>
      <label className={buttonVariants({ variant: "outline", className: "cursor-pointer" })}>
        {busy ? "Байршуулж байна..." : "+ Зураг нэмэх"}
        <input
          type="file"
          className="hidden"
          multiple
          accept={IMAGE_MIME_TYPES.join(",")}
          disabled={busy}
          onChange={(e) => {
            onFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </label>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
