import { describe, expect, it } from "vitest";
import { createInitialContext } from "../pipeline";
import { WalletAddressFilter } from "../plugins/wallet-address.filter";

function run(input: string) {
  return new WalletAddressFilter().apply(createInitialContext(input)).text;
}

describe("WalletAddressFilter", () => {
  it("removes full 0x addresses", () => {
    const full = "0xfc5f1234567890abcdef1234567890abcdef69ad";
    const text = run(`Company\n${full}\nGolang`);
    expect(text).toContain("Company");
    expect(text).toContain("Golang");
    expect(text).not.toContain(full);
  });

  it("removes truncated addresses like 0xfC5f...69Ad", () => {
    const text = run("BIT\n0xfC5f...69Ad\nGolang Engineer");
    expect(text).toContain("BIT");
    expect(text).toContain("Golang Engineer");
    expect(text).not.toContain("0xfC5f...69Ad");
  });

  it("preserves company URLs and tech terms", () => {
    const text = run(
      "Company Website: https://www.bit.com/\nSkills: Golang Redis",
    );
    expect(text).toContain("https://www.bit.com/");
    expect(text).toContain("Golang");
    expect(text).toContain("Redis");
  });
});
