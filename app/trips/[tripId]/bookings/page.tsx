import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, FileText, MapPin } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ItemTypeIcon } from "@/components/itinerary/ItemTypeIcon";
import { formatDayLabel, formatTimeRange } from "@/lib/utils/dates";
import { formatPrice } from "@/lib/utils/currency";
import type { Database } from "@/lib/types/database.types";

type ItineraryItem = Database["public"]["Tables"]["itinerary_items"]["Row"];

type AttachmentLink = { id: string; fileName: string; url: string };

export default async function TripBookingsPage({
  params,
}: PageProps<"/trips/[tripId]/bookings">) {
  const { tripId } = await params;
  const supabase = await createClient();

  const { data: trip } = await supabase
    .from("trips")
    .select("id")
    .eq("id", tripId)
    .single();

  if (!trip) notFound();

  const [{ data: days }, { data: items }] = await Promise.all([
    supabase
      .from("itinerary_days")
      .select("id, date")
      .eq("trip_id", tripId)
      .order("date", { ascending: true }),
    supabase
      .from("itinerary_items")
      .select("*")
      .eq("trip_id", tripId)
      .in("type", ["accommodation", "transport"])
      .order("start_time", { ascending: true, nullsFirst: false })
      .order("sort_order", { ascending: true }),
  ]);

  const bookingItems = (items ?? []) as ItineraryItem[];

  // Non-image attachments (booking PDFs / e-tickets) for these items.
  const attachmentsByItem = new Map<string, AttachmentLink[]>();
  if (bookingItems.length > 0) {
    const { data: files } = await supabase
      .from("item_attachments")
      .select("id, item_id, storage_path, file_name")
      .in(
        "item_id",
        bookingItems.map((i) => i.id)
      )
      .not("mime_type", "like", "image/%")
      .order("sort_order", { ascending: true });

    if (files && files.length > 0) {
      const { data: signed } = await supabase.storage
        .from("trip-photos")
        .createSignedUrls(
          files.map((f) => f.storage_path),
          3600
        );
      const urlByPath = new Map(signed?.map((s) => [s.path, s.signedUrl]));
      for (const f of files) {
        const list = attachmentsByItem.get(f.item_id) ?? [];
        list.push({
          id: f.id,
          fileName: f.file_name ?? "Attachment",
          url: urlByPath.get(f.storage_path) ?? "",
        });
        attachmentsByItem.set(f.item_id, list);
      }
    }
  }

  const dayIndexById = new Map(
    (days ?? []).map((day, i) => [day.id, i] as const)
  );

  // Order groups by day date; unscheduled bookings sort last.
  const groups = new Map<
    string,
    { label: string; order: number; items: ItineraryItem[] }
  >();

  for (const item of bookingItems) {
    const dayIndex = item.day_id ? dayIndexById.get(item.day_id) : undefined;
    const day = item.day_id
      ? (days ?? []).find((d) => d.id === item.day_id)
      : undefined;
    const key = item.day_id ?? "unscheduled";
    if (!groups.has(key)) {
      groups.set(key, {
        label:
          day && dayIndex !== undefined
            ? formatDayLabel(day.date, dayIndex + 1)
            : "Unscheduled",
        order: dayIndex ?? Number.MAX_SAFE_INTEGER,
        items: [],
      });
    }
    groups.get(key)!.items.push(item);
  }

  const orderedGroups = [...groups.values()].sort((a, b) => a.order - b.order);

  const totalsByCurrency = new Map<string, number>();
  for (const item of bookingItems) {
    if (item.price_amount === null) continue;
    const currency = item.price_currency ?? "USD";
    totalsByCurrency.set(
      currency,
      (totalsByCurrency.get(currency) ?? 0) + item.price_amount
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl p-6">
      {orderedGroups.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
          No bookings yet. Accommodation and transport items show up here.
        </div>
      ) : (
        <>
          {totalsByCurrency.size > 0 && (
            <div className="mb-6 flex flex-wrap items-baseline gap-x-2 gap-y-1 text-sm text-muted-foreground">
              <span>Booked total:</span>
              {[...totalsByCurrency.entries()].map(([currency, amount], i) => (
                <span key={currency} className="font-medium text-foreground">
                  {formatPrice(amount, currency)}
                  {i < totalsByCurrency.size - 1 ? "," : ""}
                </span>
              ))}
            </div>
          )}

          <div className="space-y-6">
            {orderedGroups.map((group) => (
              <section key={group.label}>
                <h2 className="mb-2 text-sm font-medium text-muted-foreground">
                  {group.label}
                </h2>
                <div className="space-y-3">
                  {group.items.map((item) => (
                    <BookingCard
                      key={item.id}
                      tripId={tripId}
                      item={item}
                      attachments={attachmentsByItem.get(item.id) ?? []}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function BookingCard({
  tripId,
  item,
  attachments,
}: {
  tripId: string;
  item: ItineraryItem;
  attachments: AttachmentLink[];
}) {
  const time = formatTimeRange(item.start_time, item.end_time, item.all_day);
  const price = formatPrice(item.price_amount, item.price_currency);

  return (
    <Card className="gap-2 py-4">
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

            <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1">
              {item.url && (
                <a
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-primary underline"
                >
                  <ExternalLink className="size-3" />
                  Booking link
                </a>
              )}
              {attachments.map((file) => (
                <a
                  key={file.id}
                  href={file.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-primary underline"
                >
                  <FileText className="size-3" />
                  {file.fileName}
                </a>
              ))}
            </div>
          </div>

          <div className="shrink-0 text-right text-sm">
            {time && <p className="whitespace-nowrap">{time}</p>}
            {price && (
              <p className="mt-1 whitespace-nowrap font-medium">{price}</p>
            )}
          </div>
        </div>

        {item.day_id && (
          <Link
            href={`/trips/${tripId}/day/${item.day_id}`}
            className="mt-2 inline-block text-xs text-muted-foreground underline"
          >
            View in itinerary
          </Link>
        )}
      </CardContent>
    </Card>
  );
}
