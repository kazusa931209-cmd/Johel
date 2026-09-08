import { describe, expect, it } from "vitest";
import { mergeExperienceFieldUpdate } from "../merge-experience-field.js";

describe("mergeExperienceFieldUpdate", () => {
  it("returns existing when delta is empty", () => {
    expect(mergeExperienceFieldUpdate("- **Old**\n  Text", null)).toBe(
      "- **Old**\n  Text",
    );
    expect(mergeExperienceFieldUpdate("- **Old**\n  Text", "")).toBe(
      "- **Old**\n  Text",
    );
    expect(mergeExperienceFieldUpdate("- **Old**\n  Text", "   ")).toBe(
      "- **Old**\n  Text",
    );
  });

  it("returns delta when existing is empty", () => {
    expect(mergeExperienceFieldUpdate("", "- **New**\n  Bullet")).toBe(
      "- **New**\n  Bullet",
    );
    expect(mergeExperienceFieldUpdate(null, "- **New**\n  Bullet")).toBe(
      "- **New**\n  Bullet",
    );
  });

  it("appends delta when both are non-empty and distinct", () => {
    const existing = "- **Legacy migration**\n  Monolith could not scale.";
    const delta = "- **Nonce conflicts**\n  Shared wallet caused clashes.";
    expect(mergeExperienceFieldUpdate(existing, delta)).toBe(
      `${existing}\n\n${delta}`,
    );
  });

  it("skips duplicate when existing already contains delta", () => {
    const existing =
      "- **Legacy migration**\n  Monolith could not scale.\n\n- **Nonce conflicts**\n  Shared wallet caused clashes.";
    const delta = "- **Nonce conflicts**\n  Shared wallet caused clashes.";
    expect(mergeExperienceFieldUpdate(existing, delta)).toBe(existing);
  });

  it("returns existing when delta equals existing", () => {
    const text = "- **Same**\n  Content.";
    expect(mergeExperienceFieldUpdate(text, text)).toBe(text);
  });

  it("uses delta when it contains the full existing text (AI full replacement)", () => {
    const existing = "- **Old**\n  Short.";
    const delta =
      "- **Old**\n  Short.\n\n- **Refined**\n  Rewritten and expanded.";
    expect(mergeExperienceFieldUpdate(existing, delta)).toBe(delta);
  });
});
