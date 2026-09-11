import { afterEach, describe, expect, it } from "vitest";
import { validateDeployConfig } from "../deploy-config.js";

const TEST_JWT = "x".repeat(32);
const TEST_ENC = Buffer.alloc(32, 3).toString("base64");

describe("validateDeployConfig", () => {
  afterEach(() => {
    delete process.env.PUBLIC_DEPLOY;
    delete process.env.JWT_SECRET;
    delete process.env.ENCRYPTION_KEY;
    delete process.env.TRUST_PROXY;
  });

  it("allows local dev without public flags", () => {
    expect(() => validateDeployConfig()).not.toThrow();
  });

  it("requires strong secrets in public deploy mode", () => {
    process.env.PUBLIC_DEPLOY = "true";
    process.env.JWT_SECRET = "change-me-in-local-docker";
    process.env.ENCRYPTION_KEY = TEST_ENC;
    process.env.TRUST_PROXY = "true";

    expect(() => validateDeployConfig()).toThrow(/JWT_SECRET/);
  });

  it("passes when public deploy secrets are configured", () => {
    process.env.PUBLIC_DEPLOY = "true";
    process.env.JWT_SECRET = TEST_JWT;
    process.env.ENCRYPTION_KEY = TEST_ENC;
    process.env.TRUST_PROXY = "true";

    expect(() => validateDeployConfig()).not.toThrow();
  });
});
