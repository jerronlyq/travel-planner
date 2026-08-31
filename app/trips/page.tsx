import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { TripCard } from "@/components/trip/TripCard";
import { Button } from "@/components/ui/button";

export default async function TripsPage() {
  const supabase = await createClient();
  const { data: trips } = await supabase
    .from("trips")
    .select("*")
    .order("start_date", { ascending: true, nullsFirst: false });

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Your trips</h1>
        <Button render={<Link href="/trips/new" />} nativeButton={false}>
          New trip
        </Button>
      </div>

      {trips && trips.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {trips.map((trip) => (
            <TripCard key={trip.id} trip={trip} />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
          No trips yet. Create your first one to start planning.
        </div>
      )}
    </div>
  );
}
