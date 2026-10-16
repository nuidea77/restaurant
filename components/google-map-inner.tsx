"use client";

import { useEffect } from "react";
import { AdvancedMarker, Map, Pin, useMap } from "@vis.gl/react-google-maps";

/** Advanced marker-т Map ID шаардлагатай. Google Cloud → Map Management-аас үүсгэсэн ID-г тохируулна. */
export const GOOGLE_MAP_ID = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || "DEMO_MAP_ID";

function Camera({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    if (!map) return;
    map.panTo({ lat: center[0], lng: center[1] });
    map.setZoom(zoom);
  }, [map, center, zoom]);
  return null;
}

export function GoogleMapInner({
  center,
  zoom,
  position,
  onPick,
}: {
  center: [number, number];
  zoom: number;
  position: [number, number] | null;
  onPick: (lat: number, lng: number) => void;
}) {
  return (
    <div className="h-72 w-full overflow-hidden rounded-lg border">
      <Map
        mapId={GOOGLE_MAP_ID}
        defaultCenter={{ lat: center[0], lng: center[1] }}
        defaultZoom={zoom}
        gestureHandling="greedy"
        streetViewControl={false}
        mapTypeControl={false}
        onClick={(e) => {
          const ll = e.detail.latLng;
          if (ll) onPick(ll.lat, ll.lng);
        }}
      >
        <Camera center={center} zoom={zoom} />
        {position && (
          <AdvancedMarker
            position={{ lat: position[0], lng: position[1] }}
            draggable
            onDragEnd={(e) => {
              if (e.latLng) onPick(e.latLng.lat(), e.latLng.lng());
            }}
          >
            <Pin background="#4680ff" borderColor="#2f6bf0" glyphColor="#ffffff" />
          </AdvancedMarker>
        )}
      </Map>
    </div>
  );
}
