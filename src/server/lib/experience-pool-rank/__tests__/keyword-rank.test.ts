import { describe, expect, it } from "vitest";
import {
  rankExperiencesByKeywordOverlap,
  selectTopKeywordExperienceIds,
} from "../keyword-rank";

describe("keyword-rank", () => {
  const experiences = [
    {
      id: "exp-api",
      category: "Multi-tenant Retail APIs",
      problem: "- **Scale**\n  Built NestJS APIs for retail tenants.",
    },
    {
      id: "exp-sync",
      category: "On-chain Transaction Sync",
      problem: "- **Sync**\n  Indexed blockchain events in Go.",
    },
    {
      id: "exp-ui",
      category: "Dashboard UI",
      problem: "- **UI**\n  React admin dashboards.",
    },
  ];

  it("ranks experiences by keyword overlap with user facts", () => {
    const ranked = rankExperiencesByKeywordOverlap(
      "Added NestJS API caching for retail tenants",
      experiences,
    );

    expect(ranked[0]?.id).toBe("exp-api");
    expect(ranked.some((item) => item.id === "exp-sync")).toBe(false);
  });

  it("returns top K ids only", () => {
    const ids = selectTopKeywordExperienceIds(
      "Built NestJS APIs and React dashboards",
      experiences,
      1,
    );

    expect(ids).toHaveLength(1);
    expect(ids[0]).toBe("exp-api");
  });

  it("returns empty when no overlap", () => {
    expect(
      selectTopKeywordExperienceIds("Kubernetes cluster autoscaling", experiences, 5),
    ).toEqual([]);
  });
});
