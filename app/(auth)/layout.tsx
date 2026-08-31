import Link from "next/link";
import { Compass } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex flex-1 items-center justify-center overflow-hidden p-6">
      <div
        aria-hidden
        className="from-primary/15 via-background to-sky/15 pointer-events-none absolute inset-0 bg-gradient-to-br"
      />
      <div className="relative w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <Link
            href="/"
            className="bg-primary text-primary-foreground flex size-11 items-center justify-center rounded-2xl shadow-[var(--shadow-glow)]"
          >
            <Compass className="size-6" />
          </Link>
          <div>
            <p className="font-heading text-lg font-semibold tracking-tight">
              Wanderplan
            </p>
            <p className="text-muted-foreground text-sm">
              Plan trips together.
            </p>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}
