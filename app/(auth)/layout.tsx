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
      <div className="relative w-full max-w-lg">{children}</div>
    </div>
  );
}
