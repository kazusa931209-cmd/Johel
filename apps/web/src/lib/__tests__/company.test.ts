import { describe, expect, it } from "vitest";
import {
  orderCompaniesForCombineDisplay,
  sortCompaniesByDisplayPriority,
} from "../company";

const workspace = [
  { id: "a", displayPriority: 3, name: "Alpha" },
  { id: "b", displayPriority: 1, name: "Beta" },
  { id: "c", displayPriority: 2, name: "Gamma" },
  { id: "d", displayPriority: 4, name: "Delta" },
];

describe("sortCompaniesByDisplayPriority", () => {
  it("sorts by displayPriority ascending, then name, then id", () => {
    const sorted = sortCompaniesByDisplayPriority([
      {
        id: "c",
        displayPriority: 2,
        name: "Beta",
      },
      {
        id: "a",
        displayPriority: 1,
        name: "Zeta",
      },
      {
        id: "b",
        displayPriority: 1,
        name: "Alpha",
      },
    ]);

    expect(sorted.map((company) => company.id)).toEqual(["b", "a", "c"]);
  });
});

describe("orderCompaniesForCombineDisplay", () => {
  it("uses display priority when nothing is included", () => {
    const ordered = orderCompaniesForCombineDisplay(workspace, []);

    expect(ordered.map((company) => company.id)).toEqual(["b", "c", "a", "d"]);
  });

  it("shows included companies in selection order, then unselected by priority", () => {
    const ordered = orderCompaniesForCombineDisplay(workspace, [
      { companyId: "a" },
      { companyId: "c" },
    ]);

    expect(ordered.map((company) => company.id)).toEqual(["a", "c", "b", "d"]);
  });

  it("skips included entries that are missing from the workspace", () => {
    const ordered = orderCompaniesForCombineDisplay(workspace, [
      { companyId: "missing" },
      { companyId: "c" },
      { companyId: "a" },
    ]);

    expect(ordered.map((company) => company.id)).toEqual(["c", "a", "b", "d"]);
  });
});
