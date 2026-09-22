import { Hono } from "hono";
import { afterEach, describe, expect, it } from "vitest";
import { resolveSessionCookieSecure } from "../auth";

async function resolveWithHeaders(headers: Record<string, string>) {
  const app = new Hono();
  let captured: ReturnType<typeof resolveSessionCookieSecure> | null = null;

  app.get("/test", (c) => {
    captured = resolveSessionCookieSecure(c);
    return c.text("ok");
  });

  await app.request("/test", { headers });
  return captured;
}

describe("resolveSessionCookieSecure", () => {
  afterEach(() => {
    delete process.env.SESSION_COOKIE_SECURE;
    delete process.env.PUBLIC_DEPLOY;
    delete process.env.TRUST_PROXY;
  });

  it("returns false for plain HTTP forwarded proto", async () => {
    expect(await resolveWithHeaders({ "x-forwarded-proto": "http" })).toBe(
      false,
    );
  });

  it("returns true for HTTPS forwarded proto", async () => {
    expect(await resolveWithHeaders({ "x-forwarded-proto": "https" })).toBe(
      true,
    );
  });

  it("honors SESSION_COOKIE_SECURE override", async () => {
    process.env.SESSION_COOKIE_SECURE = "false";
    expect(await resolveWithHeaders({ "x-forwarded-proto": "https" })).toBe(
      false,
    );
  });
});
