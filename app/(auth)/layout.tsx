import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex flex-1 items-center justify-center overflow-hidden p-6">
      <div
        aria-hidden
        className="from-brand/10 via-background to-brand-alt/10 pointer-events-none absolute inset-0 bg-gradient-to-br"
      />
      <div className="relative w-full max-w-sm">
        <div className="mb-7 text-center">
          <Link
            href="/"
            className="font-heading text-[26px] italic tracking-[-0.01em]"
          >
            Wanderplan
          </Link>
          <p className="eyebrow mt-1">Shared itineraries</p>
        </div>
        {children}
      </div>
    </div>
  );
}
