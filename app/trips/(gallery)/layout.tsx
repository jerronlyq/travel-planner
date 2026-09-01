import { getCurrentProfile } from "@/lib/supabase/current-user";
import { NavBar } from "@/components/layout/NavBar";

/**
 * Wraps the trip gallery and the new-trip form. Trip detail pages
 * (`[tripId]/*`) sit outside this group and use the sidebar shell instead.
 */
export default async function GalleryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getCurrentProfile();

  return (
    <div className="flex min-h-dvh flex-1 flex-col">
      <NavBar
        displayName={profile?.display_name ?? profile?.email ?? "You"}
      />
      {children}
    </div>
  );
}
