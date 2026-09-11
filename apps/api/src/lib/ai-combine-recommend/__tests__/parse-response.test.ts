import { describe, expect, it } from "vitest";
import { parseCombineRecommendResponse } from "../parse-response.js";
import { buildCombineRecommendRefMaps } from "../refs.js";

const companyA = "cmtsuua5f0063s9j1fne229tl";
const companyB = "cmts7qgj6000kpn2wtdqm2e6o";
const ownershipId = "cmtt1shpi007l8oazhegektiy";
const ragId = "cmtt1dvss003b8oazx6dov4ko";

const refMaps = buildCombineRecommendRefMaps({
  experienceIds: [ownershipId, ragId],
  companyIds: [companyA, companyB],
});

describe("parseCombineRecommendResponse", () => {
  it("maps refs to database ids", () => {
    const payload = {
      companies: [
        {
          companyRef: "C01",
          experienceRefs: ["E01", "E02"],
          rationale: "Strong fit.",
        },
        {
          companyRef: "C02",
          experienceRefs: ["E02"],
          rationale: "RAG evidence.",
        },
      ],
      warnings: ["Thin overlap."],
    };

    const result = parseCombineRecommendResponse(
      JSON.stringify(payload),
      refMaps,
    );

    expect(result).toEqual({
      success: true,
      result: {
        companies: [
          {
            companyId: companyA,
            experienceIds: [ownershipId, ragId],
            rationale: "Strong fit.",
          },
          {
            companyId: companyB,
            experienceIds: [ragId],
            rationale: "RAG evidence.",
          },
        ],
        warnings: ["Thin overlap."],
      },
    });
  });

  it("accepts unpadded experience refs", () => {
    const payload = {
      companies: [
        {
          companyRef: "c1",
          experienceRefs: ["e1"],
          rationale: "Ownership evidence.",
        },
      ],
      warnings: [],
    };

    const result = parseCombineRecommendResponse(
      JSON.stringify(payload),
      refMaps,
    );

    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.result.companies[0]?.experienceIds).toEqual([ownershipId]);
  });

  it("rejects unknown refs", () => {
    const payload = {
      companies: [
        {
          companyRef: "C01",
          experienceRefs: ["E99"],
          rationale: "No match.",
        },
      ],
      warnings: [],
    };

    const result = parseCombineRecommendResponse(
      JSON.stringify(payload),
      refMaps,
    );

    expect(result).toEqual({
      success: false,
      error: "Unknown experienceRef in response: E99",
    });
  });

  it("caps mapped experience ids per company", () => {
    const payload = {
      companies: [
        {
          companyRef: "C01",
          experienceRefs: ["E01", "E02"],
          rationale: "Too many refs.",
        },
      ],
      warnings: [],
    };

    const result = parseCombineRecommendResponse(
      JSON.stringify(payload),
      refMaps,
      1,
    );

    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.result.companies[0]?.experienceIds).toEqual([ownershipId]);
  });

  it("dedupes mapped experience ids", () => {
    const payload = {
      companies: [
        {
          companyRef: "C01",
          experienceRefs: ["E01", "E01", "e1"],
          rationale: "Duplicate refs.",
        },
      ],
      warnings: [],
    };

    const result = parseCombineRecommendResponse(
      JSON.stringify(payload),
      refMaps,
    );

    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.result.companies[0]?.experienceIds).toEqual([ownershipId]);
  });
});
