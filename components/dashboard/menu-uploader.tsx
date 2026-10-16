"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";
import { MENU_MIME_TYPES } from "@/lib/constants";
import { directUpload } from "@/lib/upload";

type Stage = "idle" | "uploading" | "extracting";

export function MenuUploader({ userId }: { userId: string }) {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("idle");
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  async function onFile(file: File | undefined) {
    if (!file) return;
    setMessage(null);
    if (!(MENU_MIME_TYPES as readonly string[]).includes(file.type)) {
      return setMessage({ ok: false, text: "Зөвхөн PDF, PNG, JPG файл оруулна уу" });
    }
    try {
      setStage("uploading");
      const url = await directUpload(file, "menus", userId);
      setStage("extracting");
      const res = await fetch("/api/menus/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "AI боловсруулалт амжилтгүй");
      setMessage({ ok: true, text: `${body.packages.length} багц илэрлээ. Доор шалгаж баталгаажуулна уу.` });
      router.refresh();
    } catch (e) {
      setMessage({ ok: false, text: (e as Error).message });
    } finally {
      setStage("idle");
    }
  }

  const busy = stage !== "idle";
  return (
    <div className="space-y-3">
      <label
        className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-8 text-center hover:bg-muted ${busy ? "pointer-events-none opacity-60" : ""}`}
      >
        <Upload className="h-8 w-8 text-muted-foreground" />
        <span className="font-medium">
          {stage === "uploading" ? "Байршуулж байна..." : stage === "extracting" ? "AI цэсийг уншиж байна (1 мин хүртэл)..." : "Цэс байршуулах"}
        </span>
        <span className="text-sm text-muted-foreground">PDF, PNG, JPG · дээд тал нь 10MB</span>
        <input
          type="file"
          className="hidden"
          accept={MENU_MIME_TYPES.join(",")}
          disabled={busy}
          onChange={(e) => {
            onFile(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
      </label>
      {message && <p className={`text-sm ${message.ok ? "text-green-700" : "text-destructive"}`}>{message.text}</p>}
    </div>
  );
}
