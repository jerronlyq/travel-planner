"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow, parseISO } from "date-fns";
import { toast } from "sonner";
import { X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { TripRole } from "@/lib/types/database.types";

type Member = {
  userId: string;
  role: TripRole;
  joinedAt: string;
  displayName: string | null;
  email: string;
};

type Invite = {
  id: string;
  email: string;
  role: TripRole;
  created_at: string;
};

const AVATAR_BG = [
  "var(--brand)",
  "var(--brand-alt)",
  "var(--brand-third)",
  "oklch(0.5 0.03 60)",
  "oklch(0.6 0.13 70)",
];

export function MemberList({
  tripId,
  members,
  invites,
  currentUserId,
  isOwner,
}: {
  tripId: string;
  members: Member[];
  invites: Invite[];
  currentUserId: string;
  isOwner: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);
  const ownerCount = members.filter((m) => m.role === "owner").length;

  async function handleRoleChange(userId: string, role: TripRole) {
    setPending(userId);
    const supabase = createClient();
    const { error } = await supabase
      .from("trip_members")
      .update({ role })
      .eq("trip_id", tripId)
      .eq("user_id", userId);
    setPending(null);

    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Role updated");
    router.refresh();
  }

  async function handleRemove(userId: string) {
    setPending(userId);
    const supabase = createClient();
    const { error } = await supabase
      .from("trip_members")
      .delete()
      .eq("trip_id", tripId)
      .eq("user_id", userId);
    setPending(null);

    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Member removed");
    router.refresh();
  }

  async function handleRevokeInvite(inviteId: string) {
    setPending(inviteId);
    const supabase = createClient();
    const { error } = await supabase
      .from("trip_invites")
      .update({ status: "revoked" })
      .eq("id", inviteId);
    setPending(null);

    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Invite revoked");
    router.refresh();
  }

  return (
    <div className="space-y-8">
      <div className="border-border/70 border-t">
        {members.map((member, i) => {
          const isLastOwner = member.role === "owner" && ownerCount <= 1;
          const isSelf = member.userId === currentUserId;
          const name = member.displayName ?? member.email;

          return (
            <div
              key={member.userId}
              className="border-border/70 flex items-center gap-3 border-b py-3.5"
            >
              <span
                className="font-heading flex size-[42px] shrink-0 items-center justify-center rounded-full text-[17px] text-[oklch(0.98_0.01_85)]"
                style={{ background: AVATAR_BG[i % AVATAR_BG.length] }}
              >
                {name.charAt(0).toUpperCase()}
              </span>

              <div className="min-w-0 flex-1">
                <p className="font-heading text-[20px] leading-[1.2] tracking-[-0.01em]">
                  {name}
                  {isSelf && (
                    <span className="text-muted-foreground font-sans text-[13px]">
                      {" "}
                      · you
                    </span>
                  )}
                </p>
                <p className="text-muted-foreground truncate text-[12.5px]">
                  {member.email}
                </p>
              </div>

              {isOwner ? (
                <div className="flex shrink-0 items-center gap-1.5">
                  <Select
                    value={member.role}
                    onValueChange={(v) =>
                      v && handleRoleChange(member.userId, v as TripRole)
                    }
                    disabled={isLastOwner || pending === member.userId}
                  >
                    <SelectTrigger className="hover:border-brand h-7 rounded-full border px-3 font-mono text-[10px] tracking-[0.1em] uppercase">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="owner">Owner</SelectItem>
                      <SelectItem value="editor">Editor</SelectItem>
                      <SelectItem value="viewer">Viewer</SelectItem>
                    </SelectContent>
                  </Select>
                  {!isLastOwner && (
                    <button
                      type="button"
                      aria-label={`Remove ${name}`}
                      disabled={pending === member.userId}
                      onClick={() => handleRemove(member.userId)}
                      className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive inline-flex size-8 items-center justify-center rounded-full transition-colors disabled:opacity-50"
                    >
                      <X className="size-4" />
                    </button>
                  )}
                </div>
              ) : (
                <span className="border-border shrink-0 rounded-full border px-3 py-1 font-mono text-[10px] tracking-[0.1em] uppercase">
                  {member.role}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {isOwner && invites.length > 0 && (
        <div>
          <p className="data-label tracking-[0.12em]">Pending invites</p>
          <div className="border-border mt-2 flex flex-col gap-3 rounded-[4px] border border-dashed p-4">
            {invites.map((invite) => (
              <div
                key={invite.id}
                className="flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="font-heading truncate text-[19px] tracking-[-0.01em]">
                    {invite.email}
                  </p>
                  <p className="text-muted-foreground font-mono text-[10px] tracking-[0.08em] uppercase">
                    {invite.role} · sent{" "}
                    {formatDistanceToNow(parseISO(invite.created_at), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={pending === invite.id}
                  onClick={() => handleRevokeInvite(invite.id)}
                  className="text-brand shrink-0 text-[12.5px] font-semibold underline underline-offset-2 disabled:opacity-50"
                >
                  Revoke
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
