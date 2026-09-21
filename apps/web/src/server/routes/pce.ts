import { Hono } from "hono";
import { loadPce } from "../lib/pce";
import { requireUser } from "../lib/session";

export const pceRoutes = new Hono();

pceRoutes.get("/", async (c) => {
  const user = await requireUser(c);
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const data = await loadPce(user.id);
  return c.json(data);
});
