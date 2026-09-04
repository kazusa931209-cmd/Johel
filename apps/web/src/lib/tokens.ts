/** Format a raw token count as compact K / M / G / T (e.g. 0.3K, 12.5K, 0.6M). */
export function formatTokenUsed(count: number): string {
  const n = Number.isFinite(count) ? Math.max(0, count) : 0;
  if (n === 0) return "0K";

  const units: { divisor: number; suffix: "T" | "G" | "M" | "K" }[] = [
    { divisor: 1_000_000_000_000, suffix: "T" },
    { divisor: 1_000_000_000, suffix: "G" },
    { divisor: 1_000_000, suffix: "M" },
    { divisor: 1_000, suffix: "K" },
  ];

  const unit =
    units.find((item) => n / item.divisor >= 0.1) ?? units[units.length - 1];
  const value = n / unit.divisor;
  const rounded = Math.round(value * 10) / 10;
  const text =
    Math.abs(rounded - Math.round(rounded)) < 1e-9
      ? String(Math.round(rounded))
      : rounded.toFixed(1);

  return `${text}${unit.suffix}`;
}
