import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatDayLabel } from "@/lib/utils/dates";

export default async function TripOverviewPage({
  params,
}: PageProps<"/trips/[tripId]/overview">) {
  const { tripId } = await params;
  const supabase = await createClient();

  const { data: trip } = await supabase
    .from("trips")
    .select("*")
    .eq("id", tripId)
    .single();

  if (!trip) notFound();

  const { data: days } = await supabase
    .from("itinerary_days")
    .select("id, date")
    .eq("trip_id", tripId)
    .order("date", { ascending: true });

  return (
    <div className="mx-auto w-full max-w-2xl p-6">
      {trip.description && (
        <p className="mb-6 text-muted-foreground">{trip.description}</p>
      )}

      <h2 className="mb-3 text-sm font-medium text-muted-foreground">
        Days
      </h2>
      {days && days.length > 0 ? (
        <ul className="space-y-2">
          {days.map((day, i) => (
            <li key={day.id}>
              <Link
                href={`/trips/${tripId}/day/${day.id}`}
                className="block rounded-lg border p-3 transition-colors hover:bg-accent"
              >
                {formatDayLabel(day.date, i + 1)}
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">
          Set start and end dates in trip settings to generate day-by-day
          planning.
        </p>
      )}
    </div>
  );
}
