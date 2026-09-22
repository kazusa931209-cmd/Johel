import { beforeEach, describe, expect, it, vi } from "vitest";

const profileFindFirst = vi.fn();
const companyFindMany = vi.fn();
const experienceFindMany = vi.fn();

vi.mock("../../prisma", () => ({
  prisma: {
    profile: {
      findFirst: profileFindFirst,
    },
    company: {
      findMany: companyFindMany,
    },
    experience: {
      findMany: experienceFindMany,
    },
  },
}));

const { assembleFromCombineSnapshot } = await import("../assemble-input.js");

describe("assembleFromCombineSnapshot", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    profileFindFirst.mockResolvedValue({
      id: "profile-1",
      firstName: "Jane",
      lastName: "Doe",
      birthDate: null,
      email: "jane@example.com",
      pn: null,
      residence: null,
      university: "State University",
      graduationYear: 2018,
      graduationMonth: 6,
      degree: "BSc",
      links: [],
    });
    companyFindMany.mockResolvedValue([
      {
        id: "company-1",
        alias: "Acme",
        name: "Acme Corp",
        whatCompanyIs: "B2B payments",
      },
    ]);
    experienceFindMany.mockResolvedValue([
      {
        id: "experience-1",
        category: "API latency",
        problem: "Slow checkout",
        actions: "Added caching",
        outcome: "Reduced p95 latency by 40%",
      },
    ]);
  });

  it("passes keywordContext through to assembled companies", async () => {
    const result = await assembleFromCombineSnapshot({
      userId: "user-1",
      jobContext: "Job context",
      combine: {
        profileId: "profile-1",
        language: "en",
        emphasis: "",
        companies: [
          {
            companyId: "company-1",
            startDate: "2020",
            endDate: "Present",
            roleContext: "Backend engineer",
            keywordContext: " AWS, AI agents ",
            experienceIds: ["experience-1"],
          },
        ],
      },
    });

    expect(result.companies[0]?.keywordContext).toBe("AWS, AI agents");
    expect(experienceFindMany).toHaveBeenCalledWith({
      where: {
        userId: "user-1",
        deletedAt: null,
        id: { in: ["experience-1"] },
      },
    });
  });

  it("omits keywordContext when blank", async () => {
    const result = await assembleFromCombineSnapshot({
      userId: "user-1",
      jobContext: "Job context",
      combine: {
        profileId: "profile-1",
        language: "en",
        emphasis: "",
        companies: [
          {
            companyId: "company-1",
            startDate: "2020",
            endDate: "Present",
            roleContext: "Backend engineer",
            keywordContext: "   ",
            experienceIds: ["experience-1"],
          },
        ],
      },
    });

    expect(result.companies[0]?.keywordContext).toBeUndefined();
  });
});
