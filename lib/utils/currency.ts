export const CURRENCIES = [
  "USD",
  "EUR",
  "GBP",
  "JPY",
  "SGD",
  "AUD",
  "CAD",
  "THB",
  "IDR",
  "MYR",
] as const;

export function formatPrice(amount: number | null, currency: string | null): string | null {
  if (amount === null) return null;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency ?? "USD",
    maximumFractionDigits: 2,
  }).format(amount);
}
