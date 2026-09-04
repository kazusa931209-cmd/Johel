import { Hono } from "hono";
import { requireUser } from "../lib/session.js";
import { sumTokenUsed } from "../lib/sum-token-used.js";

export const aiUsageRoutes = new Hono();

aiUsageRoutes.get("/summary", async (c) => {
  const user = await requireUser(c);
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const tokenUsed = await sumTokenUsed(user.id);
  return c.json({ tokenUsed });
});
