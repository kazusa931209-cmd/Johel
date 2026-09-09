import { describe, expect, it } from "vitest";
import { studioFabClusterClass } from "../drawer-position";

describe("drawer-position", () => {
  it("places FAB cluster on the right by default", () => {
    expect(studioFabClusterClass("right")).toContain("right-12");
  });

  it("places FAB cluster on the left when configured", () => {
    expect(studioFabClusterClass("left")).toContain("left-12");
  });
});
