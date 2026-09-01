"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { UnderlineField } from "@/components/ui/underline-field";

export default function SetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    router.replace("/trips");
    router.refresh();
  }

  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <div className="border-border bg-card shadow-soft w-full max-w-sm rounded-[6px] border p-[38px]">
        <p className="eyebrow">Almost there</p>
        <h1 className="font-heading mt-1 text-[28px] leading-[1.1] font-medium tracking-[-0.02em]">
          Set your password
        </h1>
        <p className="text-muted-foreground mt-2 text-[13.5px] leading-[1.55]">
          Choose a password to finish signing in.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-5">
          <UnderlineField
            label="New password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {error && <p className="text-destructive text-[13px]">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="bg-primary text-primary-foreground press mt-1 inline-flex h-11 w-full items-center justify-center rounded-full text-[14px] font-semibold tracking-[0.02em] disabled:opacity-60"
          >
            {loading ? "Saving…" : "Save password"}
          </button>
        </form>
      </div>
    </div>
  );
}
