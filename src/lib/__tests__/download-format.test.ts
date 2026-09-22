import { describe, expect, it } from "vitest";
import { isPdfDownloadAvailable } from "@/lib/api";

describe("isPdfDownloadAvailable", () => {
  it("returns false when resume language is not English", () => {
    expect(isPdfDownloadAvailable("ja")).toBe(false);
  });

  it("returns true when resume language is English", () => {
    expect(isPdfDownloadAvailable("en")).toBe(true);
  });
});
