"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { Crosshair, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CITY_CENTERS, UB } from "@/lib/constants";

// Leaflet нь window шаарддаг тул зөвхөн хөтөч дээр ачаална.
const MapPickerInner = dynamic(() => import("./map-picker-inner"), {
  ssr: false,
  loading: () => <div className="h-72 w-full animate-pulse rounded-lg border bg-muted" />,
});

type Hit = { display_name: string; lat: string; lon: string };

/**
 * Газрын зураг дээр рестораны байршлыг сонгоно (OpenStreetMap, API түлхүүр шаардахгүй).
 * Хаягаар хайх (Nominatim), "Миний байршил", зураг дээр дарах эсвэл цэгийг чирэх.
 * Сонгосон утга latitude/longitude нэртэй hidden input-ээр форм руу явна.
 */
export function MapPicker({
  city,
  initial,
  searchHint,
}: {
  city: string;
  initial: { lat: number | null; lng: number | null };
  searchHint?: string;
}) {
  const [position, setPosition] = useState<[number, number] | null>(
    initial.lat != null && initial.lng != null ? [initial.lat, initial.lng] : null,
  );
  const [view, setView] = useState<{ center: [number, number]; zoom: number }>({
    center: position ?? CITY_CENTERS[city] ?? CITY_CENTERS[UB],
    zoom: position ? 16 : 13,
  });
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  // Хот солигдоход байршил сонгоогүй бол тухайн хотын төв рүү шилжинэ.
  useEffect(() => {
    if (!position) setView({ center: CITY_CENTERS[city] ?? CITY_CENTERS[UB], zoom: 13 });
  }, [city]); // eslint-disable-line react-hooks/exhaustive-deps

  function pick(lat: number, lng: number, zoom?: number) {
    const p: [number, number] = [Number(lat.toFixed(6)), Number(lng.toFixed(6))];
    setPosition(p);
    if (zoom) setView({ center: p, zoom });
    setMessage(null);
  }

  async function search() {
    const q = [query || searchHint, city, "Mongolia"].filter(Boolean).join(", ");
    setMessage("Хайж байна...");
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=5&countrycodes=mn&accept-language=mn&q=${encodeURIComponent(q)}`,
    ).catch(() => null);
    const data: Hit[] = (await res?.json().catch(() => [])) ?? [];
    setHits(data);
    setMessage(data.length ? null : "Олдсонгүй. Газрын зураг дээр дарж байршлаа тэмдэглэнэ үү.");
  }

  function locate() {
    if (!navigator.geolocation) return setMessage("Таны хөтөч байршил тодорхойлохыг дэмжихгүй байна.");
    setMessage("Байршил тодорхойлж байна...");
    navigator.geolocation.getCurrentPosition(
      (p) => pick(p.coords.latitude, p.coords.longitude, 17),
      () => setMessage("Байршил авах зөвшөөрөл олгогдсонгүй."),
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              search();
            }
          }}
          placeholder="Хаяг, барилгын нэрээр хайх"
          aria-label="Хаягаар хайх"
        />
        <Button type="button" variant="outline" onClick={search} aria-label="Хайх">
          <Search className="h-4 w-4" />
        </Button>
        <Button type="button" variant="outline" onClick={locate} title="Миний байршил" aria-label="Миний байршил">
          <Crosshair className="h-4 w-4" />
        </Button>
      </div>
      {hits.length > 0 && (
        <ul className="divide-y overflow-hidden rounded-lg border bg-card text-sm">
          {hits.map((h) => (
            <li key={`${h.lat},${h.lon}`}>
              <button
                type="button"
                className="w-full px-3 py-2 text-left hover:bg-muted"
                onClick={() => {
                  pick(Number(h.lat), Number(h.lon), 17);
                  setHits([]);
                }}
              >
                {h.display_name}
              </button>
            </li>
          ))}
        </ul>
      )}
      <MapPickerInner center={view.center} zoom={view.zoom} position={position} onPick={(lat, lng) => pick(lat, lng)} />
      <p className="text-xs text-muted-foreground">
        {message ??
          (position
            ? `Сонгосон байршил: ${position[0]}, ${position[1]} — цэгийг чирж засаж болно.`
            : "Газрын зураг дээр дарж рестораны байршлыг тэмдэглэнэ үү.")}
      </p>
      <input type="hidden" name="latitude" value={position?.[0] ?? ""} />
      <input type="hidden" name="longitude" value={position?.[1] ?? ""} />
    </div>
  );
}
