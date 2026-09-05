import { Hono } from "hono";
import { z } from "zod";
import { AI_PROVIDER_IDS } from "../lib/ai-provider.js";
import { prisma } from "../lib/prisma.js";
import { maskApiKey, requireUser } from "../lib/session.js";
import { settingsProcessRoutes } from "./settings-process.js";
import { settingsPromptOptimizationRoutes } from "./settings-prompt-optimization.js";

const putSchema = z.object({
  provider: z.enum(AI_PROVIDER_IDS),
  apiKey: z.string().min(8).max(4096),
});

export const settingsRoutes = new Hono();

settingsRoutes.route("/process", settingsProcessRoutes);
settingsRoutes.route("/prompt-optimization", settingsPromptOptimizationRoutes);

settingsRoutes.get("/", async (c) => {
  const user = await requireUser(c);
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const setting = await prisma.setting.findUnique({
    where: { userId: user.id },
  });
  if (!setting) {
    return c.json({ provider: null, apiKeyMasked: null });
  }

  return c.json({
    provider: setting.provider,
    apiKeyMasked: maskApiKey(setting.apiKey),
  });
});

settingsRoutes.put("/", async (c) => {
  const user = await requireUser(c);
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const body = await c.req.json().catch(() => null);
  const parsed = putSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Invalid provider or API key" }, 400);
  }

  const apiKey = parsed.data.apiKey.trim();
  if (apiKey.length < 8) {
    return c.json({ error: "Invalid provider or API key" }, 400);
  }

  const setting = await prisma.setting.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      provider: parsed.data.provider,
      apiKey,
    },
    update: {
      provider: parsed.data.provider,
      apiKey,
    },
  });

  return c.json({
    provider: setting.provider,
    apiKeyMasked: maskApiKey(setting.apiKey),
  });
});
