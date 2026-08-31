import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MemberList } from "@/components/trip/MemberList";
import { InviteModal } from "@/components/trip/InviteModal";

export default async function MembersPage({
  params,
}: PageProps<"/trips/[tripId]/members">) {
  const { tripId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: memberRows } = await supabase
    .from("trip_members")
    .select("user_id, role, joined_at")
    .eq("trip_id", tripId)
    .order("joined_at", { ascending: true });

  if (!memberRows) notFound();

  const userIds = memberRows.map((m) => m.user_id);
  const { data: profileRows } = await supabase
    .from("profiles")
    .select("id, display_name, email")
    .in("id", userIds.length > 0 ? userIds : ["00000000-0000-0000-0000-000000000000"]);

  const profilesById = new Map((profileRows ?? []).map((p) => [p.id, p]));

  const members = memberRows.map((m) => ({
    userId: m.user_id,
    role: m.role,
    joinedAt: m.joined_at,
    displayName: profilesById.get(m.user_id)?.display_name ?? null,
    email: profilesById.get(m.user_id)?.email ?? "",
  }));

  const isOwner = members.some((m) => m.userId === user.id && m.role === "owner");

  const { data: invites } = isOwner
    ? await supabase
        .from("trip_invites")
        .select("id, email, role, created_at")
        .eq("trip_id", tripId)
        .eq("status", "pending")
        .order("created_at", { ascending: false })
    : { data: [] };

  return (
    <div className="mx-auto w-full max-w-2xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-sm font-medium text-muted-foreground">
          {members.length} {members.length === 1 ? "member" : "members"}
        </h2>
        {isOwner && <InviteModal tripId={tripId} />}
      </div>

      <MemberList
        tripId={tripId}
        members={members}
        invites={invites ?? []}
        currentUserId={user.id}
        isOwner={isOwner}
      />
    </div>
  );
}
