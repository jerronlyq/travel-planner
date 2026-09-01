import { Bed, Utensils, Ticket, Car, MapPin, type LucideIcon } from "lucide-react";
import type { ItineraryItemType } from "@/lib/types/database.types";
import { cn } from "@/lib/utils";

const ICONS: Record<ItineraryItemType, LucideIcon> = {
  accommodation: Bed,
  food: Utensils,
  activity: Ticket,
  transport: Car,
  place: MapPin,
};

export const ITEM_TYPE_LABELS: Record<ItineraryItemType, string> = {
  accommodation: "Accommodation",
  food: "Food",
  activity: "Activity",
  transport: "Transport",
  place: "Place",
};

export function ItemTypeIcon({
  type,
  className,
  style,
}: {
  type: ItineraryItemType;
  className?: string;
  style?: React.CSSProperties;
}) {
  const Icon = ICONS[type];
  return <Icon className={cn("size-4", className)} style={style} />;
}
