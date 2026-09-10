import { describe, expect, it } from "vitest";
import { splitExperienceFieldUpdateDisplay } from "@/lib/experience-field-update-display";

describe("splitExperienceFieldUpdateDisplay", () => {
  it("returns empty when merged is blank", () => {
    expect(
      splitExperienceFieldUpdateDisplay("existing", "delta", "  "),
    ).toEqual({ kind: "empty" });
  });

  it("returns unchanged when there is no delta", () => {
    expect(
      splitExperienceFieldUpdateDisplay("existing text", null, "existing text"),
    ).toEqual({ kind: "unchanged", merged: "existing text" });
  });

  it("returns new_only when existing is empty", () => {
    expect(
      splitExperienceFieldUpdateDisplay("", "new bullet", "new bullet"),
    ).toEqual({ kind: "new_only", text: "new bullet" });
  });

  it("returns append when merged follows existing + blank line + delta", () => {
    expect(
      splitExperienceFieldUpdateDisplay(
        "Old paragraph",
        "New bullet",
        "Old paragraph\n\nNew bullet",
      ),
    ).toEqual({
      kind: "append",
      existing: "Old paragraph",
      addition: "New bullet",
    });
  });

  it("returns replacement when delta replaces existing", () => {
    expect(
      splitExperienceFieldUpdateDisplay(
        "Old paragraph",
        "Old paragraph\n\nExtra detail",
        "Old paragraph\n\nExtra detail",
      ),
    ).toEqual({
      kind: "replacement",
      existing: "Old paragraph",
      replacement: "Old paragraph\n\nExtra detail",
    });
  });
});
