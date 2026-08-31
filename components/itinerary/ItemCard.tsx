import { ExternalLink, MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ItemTypeIcon } from "@/components/itinerary/ItemTypeIcon";
import { formatTimeRange } from "@/lib/utils/dates";
import { formatPrice } from "@/lib/utils/currency";
import { cn } from "@/lib/utils";
import type { Database } from "@/lib/types/database.types";

type ItineraryItem = Database["public"]["Tables"]["itinerary_items"]["Row"];

export function ItemCard({
  item,
  onClick,
}: {
  item: ItineraryItem;
  onClick?: () => void;
}) {
  const time = formatTimeRange(item.start_time, item.end_time, item.all_day);
  const price = formatPrice(item.price_amount, item.price_currency);

  return (
    <Card
      onClick={onClick}
      className={cn(
        "gap-2 py-4 transition-colors",
        onClick && "cursor-pointer hover:bg-accent"
      )}
    >
      <CardContent className="px-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="gap-1">
                <ItemTypeIcon type={item.type} />
              </Badge>
              <h3 className="truncate font-medium">{item.title}</h3>
            </div>

            {item.location_name && (
              <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="size-3.5 shrink-0" />
                <span className="truncate">{item.location_name}</span>
              </p>
            )}

            {item.notes && (
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                {item.notes}
              </p>
            )}

            {item.booking_reference && (
              <p className="mt-1 text-xs text-muted-foreground">
                Confirmation: {item.booking_reference}
              </p>
            )}
          </div>

          <div className="shrink-0 text-right text-sm">
            {time && <p className="whitespace-nowrap">{time}</p>}
            {price && (
              <p className="mt-1 whitespace-nowrap font-medium">{price}</p>
            )}
            {item.url && (
              <ExternalLink className="ml-auto mt-1 size-3.5 text-muted-foreground" />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
