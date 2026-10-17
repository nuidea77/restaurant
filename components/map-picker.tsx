"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState, type ComponentType } from "react";
import { APIProvider, useMapsLibrary } from "@vis.gl/react-google-maps";
import { Crosshair, Search } from "lucide-react";
import { GoogleMapInner } from "@/components/google-map-inner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CITY_CENTERS, UB } from "@/lib/constants";

// Түлхүүргүй үеийн нөөц: Leaflet + OpenStreetMap (window шаарддаг тул зөвхөн хөтөч дээр).
const OsmMapInner = dynamic(() => import("./map-picker-inner"), {
  ssr: false,
  loading: () => <div className="h-72 w-full animate-pulse rounded-lg border bg-muted" />,
});

const GOOGLE_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

type Hit = { label: string; lat: number; lng: number };
type Geocode = (query: string) => Promise<Hit[]>;
type MapView = ComponentType<{
  center: [number, number];
  zoom: number;
  position: [number, number] | null;
  onPick: (lat: number, lng: number) => void;
}>;

type Props = { city: string; initial: { lat: number | null; lng: number | null } };

/**
 * Газрын зураг дээр газрын байршлыг сонгоно. NEXT_PUBLIC_GOOGLE_MAPS_API_KEY байвал Google Maps
 * (Maps JavaScript API + Geocoding API), үгүй бол OpenStreetMap. Сонгосон утга latitude/longitude
 * нэртэй hidden input-ээр форм руу явна.
 */
export function MapPicker(props: Props) {
  if (GOOGLE_KEY) {
    return (
      <APIProvider apiKey={GOOGLE_KEY} language="mn" region="MN">
        <GooglePicker {...props} />
      </APIProvider>
    );
  }
  return <PickerShell {...props} MapView={OsmMapInner} geocode={nominatim} />;
}

function GooglePicker(props: Props) {
  const geocoding = useMapsLibrary("geocoding");
  const geocode = useCallback<Geocode>(
    async (query) => {
      if (!geocoding) return [];
      const { results } = await new geocoding.Geocoder()
        .geocode({ address: query, componentRestrictions: { country: "MN" } })
        .catch(() => ({ results: [] as google.maps.GeocoderResult[] }));
      return results.slice(0, 5).map((r) => ({
        label: r.formatted_address,
        lat: r.geometry.location.lat(),
        lng: r.geometry.location.lng(),
      }));
    },
    [geocoding],
  );
  return <PickerShell {...props} MapView={GoogleMapInner} geocode={geocode} />;
}

const nominatim: Geocode = async (query) => {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&limit=5&countrycodes=mn&accept-language=mn&q=${encodeURIComponent(query)}`,
  ).catch(() => null);
  const data: { display_name: string; lat: string; lon: string }[] = (await res?.json().catch(() => [])) ?? [];
  return data.map((d) => ({ label: d.display_name, lat: Number(d.lat), lng: Number(d.lon) }));
};

function PickerShell({ city, initial, MapView, geocode }: Props & { MapView: MapView; geocode: Geocode }) {
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
    if (!query.trim()) return;
    setMessage("Хайж байна...");
    const results = await geocode(`${query}, ${city}`);
    setHits(results);
    setMessage(results.length ? null : "Олдсонгүй. Газрын зураг дээр дарж байршлаа тэмдэглэнэ үү.");
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
            <li key={`${h.lat},${h.lng}`}>
              <button
                type="button"
                className="w-full px-3 py-2 text-left hover:bg-muted"
                onClick={() => {
                  pick(h.lat, h.lng, 17);
                  setHits([]);
                }}
              >
                {h.label}
              </button>
            </li>
          ))}
        </ul>
      )}
      <MapView center={view.center} zoom={view.zoom} position={position} onPick={(lat, lng) => pick(lat, lng)} />
      {(message || !position) && (
        <p className="text-xs text-muted-foreground">
          {message ?? "Газрын зураг дээр дарж газрын байршлыг тэмдэглэнэ үү."}
        </p>
      )}
      <input type="hidden" name="latitude" value={position?.[0] ?? ""} />
      <input type="hidden" name="longitude" value={position?.[1] ?? ""} />
    </div>
  );
}
