import { Hono } from "hono";
import { loadPce } from "../lib/pce.js";
import { requireUser } from "../lib/session.js";

export const pceRoutes = new Hono();

pceRoutes.get("/", async (c) => {
  const user = await requireUser(c);
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const data = await loadPce(user.id);
  return c.json(data);
});
