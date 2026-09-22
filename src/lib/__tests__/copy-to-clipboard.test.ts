import { afterEach, describe, expect, it, vi } from "vitest";
import { copyTextToClipboard } from "../copy-to-clipboard";

describe("copyTextToClipboard", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns false for empty text", async () => {
    await expect(copyTextToClipboard("")).resolves.toBe(false);
    await expect(copyTextToClipboard("   ")).resolves.toBe(false);
  });

  it("uses navigator.clipboard.writeText when available", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { clipboard: { writeText } });

    await expect(copyTextToClipboard("hello")).resolves.toBe(true);
    expect(writeText).toHaveBeenCalledWith("hello");
  });

  it("returns false when clipboard API throws", async () => {
    const writeText = vi.fn().mockRejectedValue(new Error("denied"));
    vi.stubGlobal("navigator", { clipboard: { writeText } });

    const execCommand = vi.fn().mockReturnValue(false);
    vi.stubGlobal("document", {
      body: { appendChild: vi.fn(), removeChild: vi.fn() },
      createElement: vi.fn(() => ({
        value: "",
        style: {},
        setAttribute: vi.fn(),
        select: vi.fn(),
      })),
      execCommand,
    });

    await expect(copyTextToClipboard("hello")).resolves.toBe(false);
  });
});
