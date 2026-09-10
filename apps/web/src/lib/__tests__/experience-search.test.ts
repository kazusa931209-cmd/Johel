import { describe, expect, it } from "vitest";
import { matchesExperienceSearch } from "@/lib/experience-search";
import type { ExperienceDetail } from "@/lib/experience";

const sample: ExperienceDetail = {
  id: "exp-1",
  category: "On-chain sync (NestJS)",
  problem: "Replicas shared one wallet and caused nonce clashes.",
  actions: "Introduced per-replica signing and retry queue.",
  outcome: "Reduced duplicate sends by 95%.",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

describe("matchesExperienceSearch", () => {
  it("matches category text", () => {
    expect(matchesExperienceSearch(sample, "nestjs")).toBe(true);
  });

  it("matches problem, actions, and outcome text", () => {
    expect(matchesExperienceSearch(sample, "nonce")).toBe(true);
    expect(matchesExperienceSearch(sample, "retry queue")).toBe(true);
    expect(matchesExperienceSearch(sample, "95%")).toBe(true);
  });

  it("returns true for empty query", () => {
    expect(matchesExperienceSearch(sample, "   ")).toBe(true);
  });

  it("returns false when no field matches", () => {
    expect(matchesExperienceSearch(sample, "kubernetes")).toBe(false);
  });
});
