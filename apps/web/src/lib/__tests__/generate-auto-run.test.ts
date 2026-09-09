import { afterEach, describe, expect, it } from "vitest";
import {
  claimAutoRun,
  releaseAutoRun,
  resetAutoRunClaims,
} from "../generate-auto-run";

describe("generate-auto-run", () => {
  afterEach(() => {
    resetAutoRunClaims();
  });

  it("allows the first claim and rejects duplicates for the same key", () => {
    expect(claimAutoRun("verdict:abc")).toBe(true);
    expect(claimAutoRun("verdict:abc")).toBe(false);
  });

  it("allows a new claim after release", () => {
    expect(claimAutoRun("verdict:abc")).toBe(true);
    releaseAutoRun("verdict:abc");
    expect(claimAutoRun("verdict:abc")).toBe(true);
  });

  it("tracks different keys independently", () => {
    expect(claimAutoRun("verdict:a")).toBe(true);
    expect(claimAutoRun("verdict:b")).toBe(true);
    expect(claimAutoRun("verdict:a")).toBe(false);
  });
});
