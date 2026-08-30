import Link from "next/link";
import { format, parseISO } from "date-fns";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { Database } from "@/lib/types/database.types";

type Trip = Database["public"]["Tables"]["trips"]["Row"];

export function TripCard({ trip }: { trip: Trip }) {
  const dates =
    trip.start_date && trip.end_date
      ? `${format(parseISO(trip.start_date), "MMM d")} – ${format(parseISO(trip.end_date), "MMM d, yyyy")}`
      : "Dates not set";

  return (
    <Link href={`/trips/${trip.id}`}>
      <Card className="transition-colors hover:bg-accent">
        <CardHeader>
          <CardTitle>{trip.name}</CardTitle>
          <CardDescription>
            {trip.destination ?? "No destination set"} · {dates}
          </CardDescription>
        </CardHeader>
      </Card>
    </Link>
  );
}
