const CURRENCY = process.env.NEXT_PUBLIC_CURRENCY ?? "USD";

const formatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: CURRENCY,
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function money(value: number): string {
  return formatter.format(Number.isFinite(value) ? value : 0);
}
