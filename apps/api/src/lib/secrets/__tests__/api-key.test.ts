import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  ApiKeyDecryptError,
  decryptApiKeyFromStorage,
  encryptApiKeyForStorage,
} from "../api-key.js";

const TEST_KEY = Buffer.alloc(32, 7).toString("base64");
const OTHER_KEY = Buffer.alloc(32, 9).toString("base64");

describe("decryptApiKeyFromStorage", () => {
  beforeEach(() => {
    process.env.ENCRYPTION_KEY = TEST_KEY;
    delete process.env.PUBLIC_DEPLOY;
  });

  afterEach(() => {
    delete process.env.ENCRYPTION_KEY;
    delete process.env.PUBLIC_DEPLOY;
  });

  it("roundtrips encrypted API keys", () => {
    const stored = encryptApiKeyForStorage("sk-test-openai-key-12345678");
    expect(decryptApiKeyFromStorage(stored)).toBe("sk-test-openai-key-12345678");
  });

  it("throws ApiKeyDecryptError when ENCRYPTION_KEY does not match", () => {
    const stored = encryptApiKeyForStorage("sk-test-openai-key-12345678");
    process.env.ENCRYPTION_KEY = OTHER_KEY;
    expect(() => decryptApiKeyFromStorage(stored)).toThrow(ApiKeyDecryptError);
  });
});
