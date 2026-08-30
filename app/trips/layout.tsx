import { getCurrentProfile } from "@/lib/supabase/current-user";
import { NavBar } from "@/components/layout/NavBar";

export default async function TripsSectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getCurrentProfile();

  return (
    <div className="flex flex-1 flex-col">
      <NavBar displayName={profile?.display_name ?? profile?.email ?? "You"} />
      <div className="flex flex-1 flex-col">{children}</div>
    </div>
  );
}
