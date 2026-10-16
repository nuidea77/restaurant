import { Mic, MonitorPlay, SquareParking, Theater, type LucideProps } from "lucide-react";
import type { AmenityKey } from "@/lib/constants";

const ICONS = { has_host: Mic, has_stage: Theater, has_screen: MonitorPlay, has_parking: SquareParking } as const;

/** Үйлчилгээний нөхцөл бүрийн дүрс. */
export function AmenityIcon({ amenity, ...props }: { amenity: AmenityKey } & LucideProps) {
  const Icon = ICONS[amenity];
  return <Icon {...props} />;
}
