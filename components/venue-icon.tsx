import { House, Martini, TreePine, UtensilsCrossed, type LucideProps } from "lucide-react";

const ICONS: Record<string, typeof House> = {
  restaurant: UtensilsCrossed,
  lounge: Martini,
  house: House,
  resort: TreePine,
};

export function VenueIcon({ type, ...props }: { type: string } & LucideProps) {
  const Icon = ICONS[type] ?? UtensilsCrossed;
  return <Icon {...props} />;
}
