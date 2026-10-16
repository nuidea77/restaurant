"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, FileText, ImagePlus, Loader2, Upload, X, XCircle } from "lucide-react";
import { saveProfile, setImages } from "@/app/dashboard/actions";
import { MapPicker } from "@/components/map-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect as Select } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { AMENITIES, CITIES, DISTRICTS, IMAGE_MIME_TYPES, LISTING_FEE, MAX_UPLOAD_BYTES, MENU_MIME_TYPES, UB } from "@/lib/constants";
import type { Restaurant } from "@/lib/types";
import { directUpload } from "@/lib/upload";
import { formatMNT } from "@/lib/utils";

type Step = { label: string; state: "waiting" | "running" | "done" | "error"; note?: string };

/**
 * Рестораны мэдээлэл. Шинээр нэмэх үед (restaurant = null) цэс (PDF/зураг) болон заалны зургийг хамт сонгоно:
 * ресторан үүссэний дараа файлууд Vercel Blob руу шууд байршиж, цэсийг AI уншиж, төлбөрийн хуудас руу шилжинэ.
 */
export function ProfileForm({ restaurant, userId }: { restaurant: Restaurant | null; userId: string }) {
  const router = useRouter();
  const [state, action, pending] = useActionState(saveProfile, null);
  const r = restaurant;
  const [city, setCity] = useState<string>(r?.city ?? UB);
  const [menus, setMenus] = useState<File[]>([]);
  const [photos, setPhotos] = useState<File[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [steps, setSteps] = useState<Step[] | null>(null);
  const started = useRef(false);

  const isUB = city === UB;

  function addFiles(list: FileList | null, kind: "menus" | "photos") {
    if (!list) return;
    const allowed: readonly string[] = kind === "menus" ? MENU_MIME_TYPES : IMAGE_MIME_TYPES;
    const ok: File[] = [];
    for (const f of Array.from(list)) {
      if (!allowed.includes(f.type)) setFileError(`${f.name}: зөвшөөрөгдөөгүй төрөл`);
      else if (f.size > MAX_UPLOAD_BYTES) setFileError(`${f.name}: 10MB-аас том байна`);
      else ok.push(f);
    }
    (kind === "menus" ? setMenus : setPhotos)((prev) => [...prev, ...ok]);
  }

  // Ресторан үүссэний дараа файлуудыг байршуулж, цэсийг AI-аар уншуулна.
  useEffect(() => {
    if (!state?.ok || !state.id || r || started.current) return;
    started.current = true;
    const id = state.id;
    const plan: Step[] = [
      ...photos.map((f) => ({ label: `Зураг: ${f.name}`, state: "waiting" as const })),
      ...menus.map((f) => ({ label: `Цэс: ${f.name}`, state: "waiting" as const })),
    ];
    setSteps(plan);
    const update = (i: number, patch: Partial<Step>) =>
      setSteps((prev) => prev && prev.map((s, j) => (j === i ? { ...s, ...patch } : s)));

    (async () => {
      const urls: string[] = [];
      for (const [i, f] of photos.entries()) {
        update(i, { state: "running" });
        try {
          urls.push(await directUpload(f, "images", userId));
          update(i, { state: "done" });
        } catch (e) {
          update(i, { state: "error", note: (e as Error).message });
        }
      }
      if (urls.length) await setImages(id, urls);

      for (const [k, f] of menus.entries()) {
        const i = photos.length + k;
        update(i, { state: "running", note: "Байршуулж байна..." });
        try {
          const url = await directUpload(f, "menus", userId);
          update(i, { note: "AI цэсийг уншиж байна (1 мин хүртэл)..." });
          const res = await fetch("/api/menus/extract", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url, restaurantId: id }),
          });
          const body = await res.json().catch(() => ({}));
          if (!res.ok) throw new Error(body.error ?? "AI уншиж чадсангүй");
          update(i, { state: "done", note: `${body.packages.length} багц илэрлээ` });
        } catch (e) {
          update(i, { state: "error", note: `${(e as Error).message} — дараа нь удирдах хуудаснаас дахин оруулж болно.` });
        }
      }
      router.push(`/dashboard/r/${id}/pay`);
    })();
  }, [state, r, photos, menus, userId, router]);

  const busy = pending || (steps !== null && steps.some((s) => s.state !== "done" && s.state !== "error"));

  return (
    <form action={action} className="grid gap-5 sm:grid-cols-2">
      {r && <input type="hidden" name="id" value={r.id} />}
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="name">Рестораны нэр</Label>
        <Input id="name" name="name" defaultValue={r?.name} required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="city">Хот / аймаг</Label>
        <Select className="w-full" id="city" name="city" value={city} onChange={(e) => setCity(e.target.value)} required>
          {CITIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="district">{isUB ? "Дүүрэг" : "Сум / хороо"}</Label>
        {isUB ? (
          <Select
            className="w-full"
            id="district"
            name="district"
            key="ub"
            defaultValue={r && r.city === UB ? r.district : ""}
            required
          >
            <option value="" disabled>
              Сонгох
            </option>
            {DISTRICTS.map((d) => (
              <option key={d}>{d}</option>
            ))}
          </Select>
        ) : (
          <Input
            id="district"
            name="district"
            key="other"
            defaultValue={r && r.city !== UB ? r.district : ""}
            placeholder="ж: Эрдэнэт, Баян-Өндөр сум"
            required
          />
        )}
      </div>

      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="address">Хаяг</Label>
        <Input id="address" name="address" defaultValue={r?.address} placeholder="Гудамж, байр, давхар" required />
      </div>

      <div className="space-y-2 sm:col-span-2">
        <Label>Байршил (газрын зураг)</Label>
        <MapPicker city={city} initial={{ lat: r?.latitude ?? null, lng: r?.longitude ?? null }} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Утас</Label>
        <Input id="phone" name="phone" type="tel" defaultValue={r?.phone} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="capacity">Заалны багтаамж (хүн)</Label>
        <Input id="capacity" name="capacity" type="number" min={1} defaultValue={r?.capacity} required />
      </div>
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="description">Тайлбар</Label>
        <Textarea id="description" name="description" defaultValue={r?.description ?? ""} />
      </div>
      <fieldset className="flex flex-wrap gap-4 sm:col-span-2">
        {AMENITIES.map((a) => (
          <label key={a.key} className="flex items-center gap-2 text-sm">
            <input type="checkbox" name={a.key} defaultChecked={r?.[a.key] ?? false} /> {a.label}
          </label>
        ))}
      </fieldset>

      {!r && (
        <>
          <div className="space-y-2 sm:col-span-2">
            <Label>Шинэ жилийн цэс (PDF эсвэл зураг)</Label>
            <p className="text-xs text-muted-foreground">
              Хэд хэдэн файл сонгож болно. AI багц бүрийн нэр, үнэ, хүний тоо, 1 хүний үнийг гаргана. PDF, PNG, JPG · 10MB хүртэл.
            </p>
            <FileDrop
              icon={<Upload className="h-5 w-5 text-primary" />}
              label="Цэс сонгох"
              accept={MENU_MIME_TYPES.join(",")}
              onFiles={(l) => addFiles(l, "menus")}
              disabled={busy}
            />
            <FileList files={menus} onRemove={(i) => setMenus((p) => p.filter((_, j) => j !== i))} disabled={busy} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Заал, хоолны зураг (заавал биш)</Label>
            <FileDrop
              icon={<ImagePlus className="h-5 w-5 text-primary" />}
              label="Зураг сонгох"
              accept={IMAGE_MIME_TYPES.join(",")}
              onFiles={(l) => addFiles(l, "photos")}
              disabled={busy}
            />
            <FileList files={photos} onRemove={(i) => setPhotos((p) => p.filter((_, j) => j !== i))} disabled={busy} />
          </div>
          {fileError && <p className="text-sm text-destructive sm:col-span-2">{fileError}</p>}
        </>
      )}

      {steps && steps.length > 0 && (
        <ul className="space-y-2 rounded-xl border bg-accent p-4 text-sm sm:col-span-2">
          {steps.map((s, i) => (
            <li key={i} className="flex items-start gap-2">
              {s.state === "done" ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
              ) : s.state === "error" ? (
                <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
              ) : (
                <Loader2 className={`mt-0.5 h-4 w-4 shrink-0 ${s.state === "running" ? "animate-spin" : "opacity-30"}`} />
              )}
              <span>
                {s.label}
                {s.note && <span className="block text-xs text-muted-foreground">{s.note}</span>}
              </span>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
        <Button type="submit" size="lg" disabled={busy}>
          {pending
            ? "Хадгалж байна..."
            : busy
              ? "Файлуудыг боловсруулж байна..."
              : r
                ? "Хадгалах"
                : `Үргэлжлүүлэх — төлбөр ${formatMNT(LISTING_FEE)}`}
        </Button>
        {state && !state.ok && <span className="text-sm text-destructive">{state.error}</span>}
        {state?.ok && r && <span className="text-sm text-green-700">Хадгалагдлаа</span>}
      </div>
    </form>
  );
}

function FileDrop({
  icon,
  label,
  accept,
  onFiles,
  disabled,
}: {
  icon: React.ReactNode;
  label: string;
  accept: string;
  onFiles: (files: FileList | null) => void;
  disabled?: boolean;
}) {
  return (
    <label
      className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed bg-accent px-4 py-4 text-sm transition-colors hover:border-primary hover:bg-brand-soft ${disabled ? "pointer-events-none opacity-60" : ""}`}
    >
      <span className="grid h-10 w-10 place-items-center rounded-lg border bg-card shadow-sm">{icon}</span>
      <span className="font-medium">{label}</span>
      {/* name-гүй: файлууд server action-оор биш, Blob руу шууд явна (1MB хязгаараас сэргийлнэ). */}
      <input
        type="file"
        className="hidden"
        multiple
        accept={accept}
        disabled={disabled}
        onChange={(e) => {
          onFiles(e.target.files);
          e.target.value = "";
        }}
      />
    </label>
  );
}

function FileList({ files, onRemove, disabled }: { files: File[]; onRemove: (i: number) => void; disabled?: boolean }) {
  if (!files.length) return null;
  return (
    <ul className="space-y-1 text-sm">
      {files.map((f, i) => (
        <li key={`${f.name}-${i}`} className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <span className="flex-1 truncate">{f.name}</span>
          <span className="text-xs text-muted-foreground">
            {f.size < 1024 * 1024 ? `${Math.max(1, Math.round(f.size / 1024))}KB` : `${(f.size / 1024 / 1024).toFixed(1)}MB`}
          </span>
          <button type="button" onClick={() => onRemove(i)} disabled={disabled} aria-label="Хасах">
            <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
          </button>
        </li>
      ))}
    </ul>
  );
}
