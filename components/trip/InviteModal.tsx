"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { TripRole } from "@/lib/types/database.types";

type InvitableRole = Extract<TripRole, "editor" | "viewer">;

export function InviteModal({ tripId }: { tripId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<InvitableRole>("editor");
  const [loading, setLoading] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  function reset() {
    setEmail("");
    setRole("editor");
    setInviteLink(null);
    setCopied(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      toast.error("You must be signed in.");
      return;
    }

    const { data, error } = await supabase
      .from("trip_invites")
      .insert({
        trip_id: tripId,
        email: email.trim().toLowerCase(),
        role,
        invited_by: user.id,
      })
      .select("token")
      .single();

    setLoading(false);

    if (error || !data) {
      toast.error(error?.message ?? "Failed to create invite.");
      return;
    }

    setInviteLink(`${window.location.origin}/invite/${data.token}`);
  }

  async function handleCopy() {
    if (!inviteLink) return;
    await navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          reset();
          router.refresh();
        }
      }}
    >
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="bg-brand press inline-flex h-9 items-center gap-1.5 rounded-full px-4 text-[13px] font-semibold tracking-[0.02em] text-[oklch(0.98_0.01_85)]"
      >
        <UserPlus className="size-4" />
        Invite someone
      </button>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite someone to this trip</DialogTitle>
        </DialogHeader>

        {inviteLink ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              They&apos;ll need an account with this email already — share
              this link with them however you like (text, email, etc).
            </p>
            <div className="flex gap-2">
              <Input readOnly value={inviteLink} className="text-xs" />
              <Button type="button" variant="outline" size="icon" onClick={handleCopy}>
                {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
              </Button>
            </div>
            <DialogFooter>
              <Button type="button" onClick={() => setOpen(false)}>
                Done
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="invite_email">Email</Label>
              <Input
                id="invite_email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invite_role">Role</Label>
              <Select value={role} onValueChange={(v) => v && setRole(v as InvitableRole)}>
                <SelectTrigger id="invite_role" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="editor">Editor — can add and edit the itinerary</SelectItem>
                  <SelectItem value="viewer">Viewer — read-only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={loading}>
                {loading ? "Creating invite..." : "Create invite link"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
