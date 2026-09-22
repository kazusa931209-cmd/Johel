/** Format a numeric string (or number) with thousand separators, e.g. 1000 → "1,000". */
export function formatThousandsSeparated(value: string | number): string {
  const raw = String(value).trim().replace(/,/g, "");
  if (raw === "") return "0";

  const negative = raw.startsWith("-");
  const unsigned = negative ? raw.slice(1) : raw;
  if (!/^\d+(\.\d+)?$/.test(unsigned)) return String(value);

  const [integer, fraction] = unsigned.split(".");
  const grouped = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const formatted =
    fraction != null ? `${grouped}.${fraction}` : grouped;

  return negative ? `-${formatted}` : formatted;
}
