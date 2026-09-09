import { formatThousandsSeparated } from "@/lib/helper";

/** Format a raw token count for display (e.g. 12450 → "12,450"). */
export function formatTokenUsed(count: number): string {
  const n = Number.isFinite(count) ? Math.max(0, Math.round(count)) : 0;
  return formatThousandsSeparated(n);
}
