import { Skeleton } from "@/components/ui/skeleton";

export default function TripSectionLoading() {
  return (
    <div className="mx-auto w-full max-w-2xl space-y-3 p-4 sm:p-6">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-20 w-full rounded-2xl" />
      ))}
    </div>
  );
}
