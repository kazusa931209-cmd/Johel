import { describe, expect, it } from "vitest";
import { formatThousandsSeparated } from "@/lib/helper";
import { formatTokenUsed } from "@/lib/tokens";

describe("formatThousandsSeparated", () => {
  it("formats integers with comma separators", () => {
    expect(formatThousandsSeparated(0)).toBe("0");
    expect(formatThousandsSeparated(999)).toBe("999");
    expect(formatThousandsSeparated(1000)).toBe("1,000");
    expect(formatThousandsSeparated(12450)).toBe("12,450");
  });

  it("formats decimals", () => {
    expect(formatThousandsSeparated("1234.5")).toBe("1,234.5");
  });
});

describe("formatTokenUsed", () => {
  it("formats token counts with thousand separators", () => {
    expect(formatTokenUsed(0)).toBe("0");
    expect(formatTokenUsed(12450)).toBe("12,450");
  });
});
