import type { NoiseFilter, NoiseFilterContext } from "../types";

/** Full EVM address: 0x + 40 hex chars. */
const FULL_ADDRESS_RE = /\b0x[a-fA-F0-9]{40}\b/g;

/** Truncated UI form: 0xfC5f...69Ad (ellipsis ASCII or Unicode). */
const TRUNCATED_ADDRESS_RE = /\b0x[a-fA-F0-9]{2,}(?:\.{2,}|…)+[a-fA-F0-9]{2,}\b/g;

function stripWalletAddresses(input: string): string {
  let text = input.replace(FULL_ADDRESS_RE, " ");
  text = text.replace(TRUNCATED_ADDRESS_RE, " ");
  return text
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export class WalletAddressFilter implements NoiseFilter {
  name = "walletAddress";

  apply(context: NoiseFilterContext): NoiseFilterContext {
    return {
      ...context,
      text: stripWalletAddresses(context.text),
    };
  }
}
