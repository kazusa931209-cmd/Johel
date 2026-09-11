import { Hono } from "hono";
import { afterEach, describe, expect, it } from "vitest";
import { authLoginRateLimit, resetRateLimitStoreForTests } from "../rate-limit.js";

describe("authLoginRateLimit", () => {
  afterEach(() => {
    resetRateLimitStoreForTests();
    delete process.env.RATE_LIMIT_AUTH_LOGIN;
  });

  it("returns 429 after the configured limit", async () => {
    process.env.RATE_LIMIT_AUTH_LOGIN = "2";

    const app = new Hono();
    app.use("/auth/login", authLoginRateLimit());
    app.post("/auth/login", (c) => c.json({ ok: true }));

    const request = () =>
      app.request("http://127.0.0.1/auth/login", {
        method: "POST",
        headers: { "x-forwarded-for": "203.0.113.10" },
      });

    expect((await request()).status).toBe(200);
    expect((await request()).status).toBe(200);
    const blocked = await request();
    expect(blocked.status).toBe(429);
    expect(blocked.headers.get("Retry-After")).toBeTruthy();
  });
});
