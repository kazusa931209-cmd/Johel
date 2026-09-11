import { execSync } from "node:child_process";
import { rmSync } from "node:fs";
import { resolve } from "node:path";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { prisma } from "../../lib/prisma.js";
import { encryptApiKeyForStorage } from "../../lib/secrets/api-key.js";

vi.mock("../../lib/ai-combine-recommend/index.js", async (importOriginal) => {
  const actual = await importOriginal<
    typeof import("../../lib/ai-combine-recommend/index.js")
  >();
  return {
    ...actual,
    runCombineRecommend: vi.fn(async (input) => ({
      result: {
        companies: input.companies.map((company) => ({
          companyId: company.companyId,
          experienceIds: [],
          rationale: "Matched role context.",
        })),
        warnings: [],
      },
      usage: {
        inputToken: 10,
        outputToken: 20,
        input: "prompt",
        output: "response",
      },
    })),
  };
});

const apiRoot = resolve(import.meta.dirname, "../../..");
const testDbPath = resolve(apiRoot, "test-combine-recommend.db");

process.env.DATABASE_URL = `file:${testDbPath}`;
process.env.JWT_SECRET = "integration-test-jwt-secret-min-32-chars";
process.env.ENCRYPTION_KEY = Buffer.alloc(32, 9).toString("base64");
delete process.env.PUBLIC_DEPLOY;

const { createApp } = await import("../../app.js");

describe("ai-combine-recommend route", () => {
  const app = createApp();
  let cookie = "";
  let generationId = "";
  let companyId = "";

  beforeAll(async () => {
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

    const loginId = `combine-${Date.now()}@example.com`;
    const registerRes = await app.request("/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ loginId, password: "password1234" }),
    });
    expect(registerRes.status).toBe(201);
    cookie = registerRes.headers.get("set-cookie") ?? "";

    const user = await prisma.user.findUniqueOrThrow({
      where: { email: loginId },
    });

    await prisma.setting.create({
      data: {
        userId: user.id,
        provider: "openai",
        apiKey: encryptApiKeyForStorage("sk-test-openai-key-12345678"),
      },
    });

    const profile = await prisma.profile.create({
      data: {
        userId: user.id,
        firstName: "Test",
        lastName: "User",
        email: "test@example.com",
      },
    });

    const company = await prisma.company.create({
      data: {
        userId: user.id,
        alias: "Acme",
        name: "Acme Corp",
        whatCompanyIs: "Software",
        domainAndStack: "Web APIs",
      },
    });
    companyId = company.id;

    await prisma.experience.create({
      data: {
        userId: user.id,
        category: "APIs",
        problem: "Slow API",
        actions: "Optimized",
        outcome: "Fast API",
      },
    });

    const generation = await prisma.generation.create({
      data: {
        publicId: "1",
        userId: user.id,
        activeStep: "combine",
        doVerdict: false,
        doEvaluate: false,
        resumeLanguage: "en",
        verdictPrompt: "",
        generatePrompt: "",
        evaluatePrompt: "",
        jobJson: JSON.stringify({
          jobText: "Build APIs",
          filteredJobText: "Build APIs",
        }),
        combineJson: JSON.stringify({
          profileId: profile.id,
          companies: [
            {
              companyId: company.id,
              startDate: "2020-01",
              endDate: "2021-01",
              roleContext: "Backend engineer",
            },
          ],
        }),
      },
    });
    generationId = generation.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
    rmSync(testDbPath, { force: true });
  });

  it("returns experience suggestions for an owned generation", async () => {
    const res = await app.request("/ai-combine-recommend", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        cookie,
      },
      body: JSON.stringify({ generationId }),
    });

    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      companies: Array<{ companyId: string }>;
      tokenUsed: number;
    };
    expect(body.companies[0]?.companyId).toBe(companyId);
    expect(body.tokenUsed).toBeGreaterThan(0);
  });
});
