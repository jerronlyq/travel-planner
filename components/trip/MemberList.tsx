"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
    <div className="space-y-6">
      <div className="space-y-2">
        {members.map((member) => {
          const isLastOwner = member.role === "owner" && ownerCount <= 1;
          const isSelf = member.userId === currentUserId;

          return (
            <div
              key={member.userId}
              className="flex items-center justify-between rounded-lg border p-3"
            >
              <div>
                <p className="font-medium">
                  {member.displayName ?? member.email}
                  {isSelf && <span className="text-muted-foreground"> (you)</span>}
                </p>
                <p className="text-sm text-muted-foreground">{member.email}</p>
              </div>

              {isOwner ? (
                <div className="flex items-center gap-2">
                  <Select
                    value={member.role}
                    onValueChange={(v) =>
                      v && handleRoleChange(member.userId, v as TripRole)
                    }
                    disabled={isLastOwner || pending === member.userId}
                  >
                    <SelectTrigger className="w-28">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="owner">Owner</SelectItem>
                      <SelectItem value="editor">Editor</SelectItem>
                      <SelectItem value="viewer">Viewer</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={isLastOwner || pending === member.userId}
                    onClick={() => handleRemove(member.userId)}
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              ) : (
                <Badge variant="secondary" className="capitalize">
                  {member.role}
                </Badge>
              )}
            </div>
          );
        })}
      </div>

      {isOwner && invites.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-medium text-muted-foreground">
            Pending invites
          </h3>
          <div className="space-y-2">
            {invites.map((invite) => (
              <div
                key={invite.id}
                className="flex items-center justify-between rounded-lg border border-dashed p-3"
              >
                <div>
                  <p className="font-medium">{invite.email}</p>
                  <p className="text-sm text-muted-foreground capitalize">
                    {invite.role}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={pending === invite.id}
                  onClick={() => handleRevokeInvite(invite.id)}
                >
                  Revoke
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
