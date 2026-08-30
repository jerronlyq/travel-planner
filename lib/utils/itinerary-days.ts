import type { createClient } from "@/lib/supabase/client";
import { dateRange } from "@/lib/utils/dates";

// Regenerates itinerary_days rows to match a trip's current start/end dates.
// Existing days (and their items, via day_id) outside the new range are left
// in place with day_id set to null by the FK's on-delete-set-null once the
// day row is removed — so we only ever add missing days, never delete ones
// that already have content, to avoid silently orphaning itinerary items.
export async function syncItineraryDays(
  supabase: ReturnType<typeof createClient>,
  tripId: string,
  startDate: string | null,
  endDate: string | null
) {
  if (!startDate || !endDate) return;

  const dates = dateRange(startDate, endDate);
  if (dates.length === 0) return;

  const rows = dates.map((date, i) => ({
    trip_id: tripId,
    date,
    sort_order: i,
  }));

  await supabase
    .from("itinerary_days")
    .upsert(rows, { onConflict: "trip_id,date", ignoreDuplicates: true });
}
