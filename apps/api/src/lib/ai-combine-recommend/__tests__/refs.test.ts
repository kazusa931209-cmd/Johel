import { describe, expect, it } from "vitest";
import {
  buildCombineRecommendRefMaps,
  humanizeRefTokensInText,
  humanizeRefTokensInWarnings,
  resolveCompanyRef,
  resolveExperienceRef,
} from "../refs.js";

describe("buildCombineRecommendRefMaps", () => {
  it("assigns zero-padded refs in request order", () => {
    const maps = buildCombineRecommendRefMaps({
      experienceIds: ["exp-a", "exp-b"],
      companyIds: ["co-a", "co-b", "co-c"],
    });

    expect(maps.experienceRefToId.get("E01")).toBe("exp-a");
    expect(maps.experienceRefToId.get("E02")).toBe("exp-b");
    expect(maps.companyRefToId.get("C01")).toBe("co-a");
    expect(maps.companyRefToId.get("C03")).toBe("co-c");
  });
});

describe("resolveExperienceRef", () => {
  const maps = buildCombineRecommendRefMaps({
    experienceIds: ["exp-a", "exp-b"],
    companyIds: ["co-a"],
  });

  it("resolves canonical refs", () => {
    expect(
      resolveExperienceRef(
        "E02",
        maps.experienceRefToId,
        maps.experienceRefWidth,
      ),
    ).toBe("exp-b");
  });

  it("normalizes unpadded refs", () => {
    expect(
      resolveExperienceRef(
        "e2",
        maps.experienceRefToId,
        maps.experienceRefWidth,
      ),
    ).toBe("exp-b");
  });

  it("returns null for unknown refs", () => {
    expect(
      resolveExperienceRef(
        "E99",
        maps.experienceRefToId,
        maps.experienceRefWidth,
      ),
    ).toBeNull();
  });
});

describe("resolveCompanyRef", () => {
  const maps = buildCombineRecommendRefMaps({
    experienceIds: ["exp-a"],
    companyIds: ["co-a", "co-b"],
  });

  it("resolves canonical company refs", () => {
    expect(
      resolveCompanyRef("C02", maps.companyRefToId, maps.companyRefWidth),
    ).toBe("co-b");
  });
});

describe("humanizeRefTokensInWarnings", () => {
  const refMaps = buildCombineRecommendRefMaps({
    experienceIds: ["exp-rag", "exp-k8s"],
    companyIds: ["co-a", "co-b", "co-c"],
  });

  const labels = {
    companyNameById: new Map([
      ["co-a", "Mentanomaly"],
      ["co-b", "ScalyX.ai"],
      ["co-c", "Madoromi, Inc."],
    ]),
    experienceCategoryById: new Map([
      ["exp-rag", "RAG, Tool Calling & LLM Reliability"],
      ["exp-k8s", "Kubernetes AI Infrastructure & Multi-Model Serving"],
    ]),
  };

  it("replaces company refs in warnings", () => {
    expect(
      humanizeRefTokensInWarnings(
        [
          "C03 has thin overlap with the ML/MLOps-focused JD because its role context is primarily junior-to-senior backend and infrastructure engineering; only two cards were selected.",
        ],
        refMaps,
        labels,
      ),
    ).toEqual([
      "Madoromi, Inc. has thin overlap with the ML/MLOps-focused JD because its role context is primarily junior-to-senior backend and infrastructure engineering; only two cards were selected.",
    ]);
  });

  it("replaces experience refs in warnings", () => {
    expect(
      humanizeRefTokensInText(
        "E02 overlaps with E01 for the same story.",
        refMaps,
        labels,
      ),
    ).toBe(
      "Kubernetes AI Infrastructure & Multi-Model Serving overlaps with RAG, Tool Calling & LLM Reliability for the same story.",
    );
  });
});
