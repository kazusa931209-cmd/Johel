import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  decryptSecret,
  encryptSecret,
  ENCRYPTED_SECRET_PREFIX,
  isEncryptedSecret,
} from "../encrypt";

const TEST_KEY = Buffer.alloc(32, 7).toString("base64");

describe("encryptSecret", () => {
  beforeEach(() => {
    process.env.ENCRYPTION_KEY = TEST_KEY;
    delete process.env.PUBLIC_DEPLOY;
  });

  afterEach(() => {
    delete process.env.ENCRYPTION_KEY;
    delete process.env.PUBLIC_DEPLOY;
  });

  it("roundtrips plaintext through encrypt and decrypt", () => {
    const stored = encryptSecret("sk-test-openai-key-12345678");
    expect(isEncryptedSecret(stored)).toBe(true);
    expect(decryptSecret(stored)).toBe("sk-test-openai-key-12345678");
  });

  it("returns plaintext when ENCRYPTION_KEY is unset in local mode", () => {
    delete process.env.ENCRYPTION_KEY;
    const stored = encryptSecret("sk-local-only-key");
    expect(stored).toBe("sk-local-only-key");
    expect(decryptSecret(stored)).toBe("sk-local-only-key");
  });

  it("requires ENCRYPTION_KEY in public deploy mode", () => {
    delete process.env.ENCRYPTION_KEY;
    process.env.PUBLIC_DEPLOY = "true";
    expect(() => encryptSecret("sk-test")).toThrow(/ENCRYPTION_KEY/);
  });

  it("uses enc:v1 prefix", () => {
    const stored = encryptSecret("secret-value");
    expect(stored.startsWith(ENCRYPTED_SECRET_PREFIX)).toBe(true);
  });
});
