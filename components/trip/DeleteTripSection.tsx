"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function DeleteTripSection({
  tripId,
  tripName,
}: {
  tripId: string;
  tripName: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    const supabase = createClient();
    const { error } = await supabase.from("trips").delete().eq("id", tripId);

    if (error) {
      setDeleting(false);
      toast.error(error.message);
      return;
    }

    toast.success("Trip deleted");
    router.push("/trips");
  }

  return (
    <section className="space-y-3 rounded-lg border border-destructive/40 p-4">
      <div>
        <h2 className="text-lg font-semibold text-destructive">Danger zone</h2>
        <p className="text-sm text-muted-foreground">
          Deleting a trip removes every day, item, attachment record, and
          member. This can&apos;t be undone.
        </p>
      </div>

      <Button
        type="button"
        variant="destructive"
        onClick={() => {
          setConfirmText("");
          setOpen(true);
        }}
      >
        Delete trip
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete “{tripName}”?</DialogTitle>
            <DialogDescription>
              Type the trip name to confirm. This permanently deletes the trip
              for everyone.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="confirm">Trip name</Label>
            <Input
              id="confirm"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              autoComplete="off"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={confirmText !== tripName || deleting}
              onClick={handleDelete}
            >
              {deleting ? "Deleting..." : "Delete trip"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
