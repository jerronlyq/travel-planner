"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
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
    <section className="flex flex-col gap-1.5">
      <p className="text-muted-foreground max-w-[52ch] text-[13px] leading-[1.55]">
        Deleting a trip removes every day, item, attachment record and member.
        This can&rsquo;t be undone.
      </p>
      <button
        type="button"
        onClick={() => {
          setConfirmText("");
          setOpen(true);
        }}
        className="text-destructive hover:text-destructive/80 inline-flex w-fit items-center gap-1.5 text-[13px] font-semibold underline underline-offset-2 transition-colors"
      >
        <Trash2 className="size-[14px]" />
        Delete this trip
      </button>

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
