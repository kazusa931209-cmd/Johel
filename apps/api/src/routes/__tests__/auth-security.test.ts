import { execSync } from "node:child_process";
import { rmSync } from "node:fs";
import { resolve } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "../../lib/prisma.js";
import { isEncryptedSecret } from "../../lib/secrets/encrypt.js";

const apiRoot = resolve(import.meta.dirname, "../../..");
const testDbPath = resolve(apiRoot, "test-integration.db");

process.env.DATABASE_URL = `file:${testDbPath}`;
process.env.JWT_SECRET = "integration-test-jwt-secret-min-32-chars";
process.env.ENCRYPTION_KEY = Buffer.alloc(32, 9).toString("base64");
delete process.env.PUBLIC_DEPLOY;

const { createApp } = await import("../../app.js");

describe("auth and settings security", () => {
  const app = createApp();

  beforeAll(() => {
    rmSync(testDbPath, { force: true });
    execSync("npx prisma generate", {
      cwd: apiRoot,
      env: process.env,
      stdio: "pipe",
    });
    execSync("npx prisma migrate deploy", {
      cwd: apiRoot,
      env: process.env,
      stdio: "pipe",
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
    rmSync(testDbPath, { force: true });
  });

  it("stores API keys encrypted and returns masked values only", async () => {
    const loginId = `user-${Date.now()}@example.com`;
    const password = "password1234";

    const registerRes = await app.request("/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ loginId, password }),
    });
    expect(registerRes.status).toBe(201);
    const cookie = registerRes.headers.get("set-cookie") ?? "";

    const saveRes = await app.request("/settings", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        cookie,
      },
      body: JSON.stringify({
        provider: "openai",
        apiKey: "sk-test-openai-key-12345678",
      }),
    });
    expect(saveRes.status).toBe(200);
    const saved = (await saveRes.json()) as { apiKeyMasked: string };
    expect(saved.apiKeyMasked).toContain("********");
    expect(saved.apiKeyMasked).not.toContain("sk-test-openai-key-12345678");

    const user = await prisma.user.findUnique({
      where: { email: loginId },
      include: { setting: true },
    });
    expect(user?.setting?.apiKey).toBeTruthy();
    expect(isEncryptedSecret(user!.setting!.apiKey)).toBe(true);
  });

  it("invalidates the previous session after password change", async () => {
    const loginId = `pw-${Date.now()}@example.com`;
    const password = "password1234";

    const registerRes = await app.request("/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ loginId, password }),
    });
    const oldCookie = registerRes.headers.get("set-cookie") ?? "";

    const meBefore = await app.request("/auth/me", {
      headers: { cookie: oldCookie },
    });
    expect(meBefore.status).toBe(200);

    const changeRes = await app.request("/auth/password", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        cookie: oldCookie,
      },
      body: JSON.stringify({
        currentPassword: password,
        newPassword: "newpassword1234",
      }),
    });
    expect(changeRes.status).toBe(200);

    const meAfterOldCookie = await app.request("/auth/me", {
      headers: { cookie: oldCookie },
    });
    expect(meAfterOldCookie.status).toBe(401);

    const newCookie = changeRes.headers.get("set-cookie") ?? "";
    const meAfterNewCookie = await app.request("/auth/me", {
      headers: { cookie: newCookie },
    });
    expect(meAfterNewCookie.status).toBe(200);
  });
});
