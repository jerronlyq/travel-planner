import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { TripCard } from "@/components/trip/TripCard";

const FILTERS = ["All", "Upcoming", "Past"] as const;

export default async function TripsPage() {
  const supabase = await createClient();
  const { data: trips } = await supabase
    .from("trips")
    .select("*")
    .order("start_date", { ascending: true, nullsFirst: false });

  const count = trips?.length ?? 0;
  const inProgress = trips?.filter((t) => t.start_date && t.end_date).length ?? 0;

  return (
    <div className="w-full flex-1 px-4 py-7 sm:px-8">
      {/* Masthead */}
      <div className="border-border flex flex-wrap items-end justify-between gap-4 border-b pb-3.5">
        <div>
          <p className="eyebrow text-brand">
            {count === 0
              ? "Nothing on the calendar"
              : `${count} ${count === 1 ? "trip" : "trips"} · ${inProgress} in progress`}
          </p>
          <h1 className="font-heading mt-0.5 text-[40px] leading-[1.1] font-medium tracking-[-0.02em]">
            Where you&rsquo;re headed
          </h1>
        </div>

        <div className="flex gap-2">
          {FILTERS.map((f, i) => (
            <button
              key={f}
              type="button"
              className={
                i === 0
                  ? "bg-primary text-primary-foreground font-mono rounded-full px-2.5 py-[5px] text-[10px] tracking-[0.1em] uppercase"
                  : "border-border text-muted-foreground hover:border-brand hover:text-brand font-mono rounded-full border px-2.5 py-[5px] text-[10px] tracking-[0.1em] uppercase transition-colors duration-150"
              }
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {count > 0 ? (
        <div className="mt-7 grid grid-cols-2 gap-[22px] md:grid-cols-3 xl:grid-cols-4">
          {trips!.map((trip) => (
            <TripCard key={trip.id} trip={trip} />
          ))}
        </div>
      ) : (
        <div className="border-border mt-7 rounded-[4px] border border-dashed px-6 py-16 text-center">
          <p className="font-heading text-[20px]">No trips yet — start the first one.</p>
          <p className="text-muted-foreground mt-1 text-[13.5px]">
            Give it a name and rough dates; the days lay themselves out.
          </p>
          <Link
            href="/trips/new"
            className="bg-primary text-primary-foreground press mt-5 inline-flex h-10 items-center rounded-full px-5 text-[13.5px] font-semibold"
          >
            Start a trip
          </Link>
        </div>
      )}
    </div>
  );
}
