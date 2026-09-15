import { describe, expect, it } from "vitest";
import { filterGlobalSearchNavItems } from "@/lib/global-search-nav";

const labels = {
  "nav.sidebar.generate": "Generate",
  "nav.sidebar.profiles": "Profiles",
  "nav.sidebar.companies": "Companies",
  "nav.sidebar.experiences": "Experiences",
  "nav.sidebar.history": "History",
  "nav.sidebar.environment": "Environment",
  "nav.sidebar.generation": "Generation",
  "nav.sidebar.prompts": "Prompts",
  "nav.header.account": "Account",
};

describe("filterGlobalSearchNavItems", () => {
  it("returns all navigation items when query is empty", () => {
    expect(filterGlobalSearchNavItems("", labels)).toHaveLength(9);
  });

  it("matches translated labels", () => {
    const results = filterGlobalSearchNavItems("profile", labels);
    expect(results.map((item) => item.id)).toEqual(["profiles"]);
  });

  it("matches keyword aliases", () => {
    const results = filterGlobalSearchNavItems("resume", labels);
    expect(results.map((item) => item.id)).toEqual(["generate"]);
  });
});
