import { describe, expect, it } from "vitest";
import { extractLinkedExperienceIds } from "../extract-linked-ids";

describe("extractLinkedExperienceIds", () => {
  it("returns unique linked ids from combine companies", () => {
    const combineJson = JSON.stringify({
      companies: [
        { experienceIds: ["exp-a", "exp-b"] },
        { experienceIds: ["exp-b", "exp-c"] },
      ],
    });

    expect(extractLinkedExperienceIds(combineJson).sort()).toEqual([
      "exp-a",
      "exp-b",
      "exp-c",
    ]);
  });

  it("returns empty array for invalid json", () => {
    expect(extractLinkedExperienceIds("{")).toEqual([]);
  });

  it("returns empty array when companies are missing", () => {
    expect(extractLinkedExperienceIds(JSON.stringify({ profileId: "p1" }))).toEqual(
      [],
    );
  });
});
