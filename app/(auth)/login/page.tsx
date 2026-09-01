"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { UnderlineField } from "@/components/ui/underline-field";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    router.replace(searchParams.get("next") ?? "/trips");
    router.refresh();
  }

  return (
    <div className="border-border bg-card shadow-soft grid overflow-hidden rounded-[6px] border md:grid-cols-[210px_1fr]">
      {/* Photo panel — swap stripe-photo for a real image later */}
      <div className="stripe-photo relative h-[140px] md:h-auto">
        <span className="font-heading absolute top-4 left-4 text-[20px] italic text-[oklch(0.98_0.01_85)]">
          Wanderplan
        </span>
      </div>

      <div className="p-[38px] md:p-[46px]">
        <h1 className="font-heading text-[34px] leading-[1.05] font-medium tracking-[-0.02em]">
          Pick up where the trip left off
        </h1>
        <p className="text-muted-foreground mt-2 text-[13.5px] leading-[1.55]">
          Accounts are created by your trip&rsquo;s admin. Use the credentials
          you were given, or the link from your invite email.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-5">
          <UnderlineField
            label="Email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <UnderlineField
            label="Password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {error && (
            <p className="text-destructive text-[13px]">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="bg-primary text-primary-foreground press mt-1 inline-flex h-11 w-full items-center justify-center rounded-full text-[14px] font-semibold tracking-[0.02em] disabled:opacity-60"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
