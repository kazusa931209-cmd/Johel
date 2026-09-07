import { describe, expect, it } from "vitest";
import {
  buildPromptHelperUserMessage,
  getPromptHelperSystemMessage,
} from "../prompts.js";

describe("getPromptHelperSystemMessage", () => {
  it("asks for a standalone sentence from scratch", () => {
    const message = getPromptHelperSystemMessage();
    expect(message).toContain("from scratch");
    expect(message).not.toContain("append");
    expect(message).toContain("Do not reference, continue, or depend on any existing field content");
  });
});

describe("buildPromptHelperUserMessage", () => {
  it("includes only field type and user request", () => {
    const message = buildPromptHelperUserMessage({
      kind: "verdict",
      request: "Mention remote work preference.",
    });

    expect(message).toContain("Verdict Prompt");
    expect(message).toContain("Mention remote work preference.");
    expect(message).toContain("Write exactly one new sentence");
  });

  it("does not include existing field text", () => {
    const message = buildPromptHelperUserMessage({
      kind: "companyDescription",
      request: "Add a leadership focus.",
    });

    expect(message).not.toContain("Current description");
    expect(message).not.toContain("Current prompt");
    expect(message).not.toContain("existing");
    expect(message).not.toMatch(/---\n.*Existing content.*\n---/);
  });
});
