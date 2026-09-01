import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BookingStub } from "@/components/trip/BookingStub";
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

  const dayIndexById = new Map(
    (days ?? []).map((day, i) => [day.id, i] as const)
  );

  const bookingItems = ((items ?? []) as ItineraryItem[])
    .slice()
    .sort((a, b) => {
      const ai = a.day_id ? (dayIndexById.get(a.day_id) ?? 998) : 999;
      const bi = b.day_id ? (dayIndexById.get(b.day_id) ?? 998) : 999;
      if (ai !== bi) return ai - bi;
      return (a.start_time ?? "~").localeCompare(b.start_time ?? "~");
    });

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

  const totalsByCurrency = new Map<string, number>();
  for (const item of bookingItems) {
    if (item.price_amount === null) continue;
    const currency = item.price_currency ?? "USD";
    totalsByCurrency.set(
      currency,
      (totalsByCurrency.get(currency) ?? 0) + item.price_amount
    );
  }
  const totalLabel = [...totalsByCurrency.entries()]
    .map(([c, a]) => formatPrice(a, c))
    .filter(Boolean)
    .join(" · ");

  function dayLabelFor(item: ItineraryItem): string {
    if (!item.day_id) return "No day";
    const idx = dayIndexById.get(item.day_id);
    return idx === undefined ? "No day" : `Day ${String(idx + 1).padStart(2, "0")}`;
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-7 md:px-8">
      <div className="border-border flex flex-wrap items-end justify-between gap-4 border-b pb-3.5">
        <div>
          <p className="eyebrow">
            {bookingItems.length === 0
              ? "Nothing booked yet"
              : `${bookingItems.length} ${
                  bookingItems.length === 1 ? "confirmation" : "confirmations"
                } on file`}
          </p>
          <h1 className="font-heading mt-0.5 text-[34px] leading-[1.1] font-medium tracking-[-0.02em]">
            Everything that&rsquo;s locked in
          </h1>
        </div>
        {totalLabel && (
          <p className="font-mono text-muted-foreground text-[11px] tracking-[0.1em] uppercase">
            Paid / {totalLabel}
          </p>
        )}
      </div>

      {bookingItems.length === 0 ? (
        <div className="border-border mt-7 rounded-[4px] border border-dashed px-6 py-16 text-center">
          <p className="font-heading text-[20px]">Nothing booked yet.</p>
          <p className="text-muted-foreground mt-1 text-[13.5px]">
            Accommodation and transport items show up here as ticket stubs.
          </p>
        </div>
      ) : (
        <div className="mt-7 flex flex-col gap-4">
          {bookingItems.map((item) => (
            <BookingStub
              key={item.id}
              tripId={tripId}
              item={item}
              dayLabel={dayLabelFor(item)}
              attachments={attachmentsByItem.get(item.id) ?? []}
            />
          ))}
        </div>
      )}
    </div>
  );
}
