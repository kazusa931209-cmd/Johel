import { Hono } from "hono";
import { cors } from "hono/cors";
import type { MiddlewareHandler } from "hono";

type AppVariables = {
  rateLimitUserId: string;
};
import { validateDeployConfig } from "./lib/deploy-config.js";
import { ApiKeyDecryptError } from "./lib/secrets/api-key.js";
import { requireUser } from "./lib/session.js";
import {
  aiRateLimit,
  authLoginRateLimit,
  authPasswordRateLimit,
  authRegisterRateLimit,
  defaultApiRateLimit,
} from "./lib/rate-limit.js";
import { authRoutes } from "./routes/auth.js";
import { healthRoutes } from "./routes/health.js";
import { settingsRoutes } from "./routes/settings.js";
import { profilesRoutes } from "./routes/profiles.js";
import { companiesRoutes } from "./routes/companies.js";
import { experiencesRoutes } from "./routes/experiences.js";
import { aiEvaluateRoutes } from "./routes/ai-evaluate.js";
import { aiResumeRoutes } from "./routes/ai-resume.js";
import { aiJdMetaRoutes } from "./routes/ai-jd-meta.js";
import { aiVerdictRoutes } from "./routes/ai-verdict.js";
import { aiCombineRecommendRoutes } from "./routes/ai-combine-recommend.js";
import { resumeRoutes } from "./routes/resume.js";
import { aiUsageRoutes } from "./routes/ai-usage.js";
import { promptsRoutes } from "./routes/prompts.js";
import { aiExperienceAdviseRoutes } from "./routes/ai-experience-advise.js";
import { aiExperienceSplitRoutes } from "./routes/ai-experience-split.js";
import { aiCheckGapsRoutes } from "./routes/ai-check-gaps.js";
import { generationsRoutes } from "./routes/generations.js";
import { pceRoutes } from "./routes/pce.js";

function getCorsOrigins(): string[] {
  const origins = new Set([
    "http://127.0.0.1:4041",
    "http://localhost:4041",
    "http://127.0.0.1:4321",
    "http://localhost:4321",
  ]);

  const publicUrl = process.env.PUBLIC_URL?.trim();
  if (publicUrl) {
    origins.add(publicUrl);
  }

  return [...origins];
}

const attachRateLimitUserId: MiddlewareHandler = async (c, next) => {
  const user = await requireUser(c);
  if (user) {
    c.set("rateLimitUserId", user.id);
  }
  return await next();
};

export function createApp() {
  validateDeployConfig();

  const app = new Hono<{ Variables: AppVariables }>();

  app.use(
    "*",
    cors({
      origin: getCorsOrigins(),
      credentials: true,
    }),
  );

  app.use("*", defaultApiRateLimit());

  app.route("/health", healthRoutes);

  app.use("/auth/login", authLoginRateLimit());
  app.use("/auth/register", authRegisterRateLimit());
  app.use("/auth/password", attachRateLimitUserId, authPasswordRateLimit());
  app.route("/auth", authRoutes);

  const aiRateLimitMiddleware = aiRateLimit();
  const aiRoutes: MiddlewareHandler = async (c, next) => {
    const user = await requireUser(c);
    if (user) {
      c.set("rateLimitUserId", user.id);
    }
    return aiRateLimitMiddleware(c, next);
  };

  app.use("/ai-verdict/*", aiRoutes);
  app.use("/ai-jd-meta/*", aiRoutes);
  app.use("/ai-resume/*", aiRoutes);
  app.use("/ai-evaluate/*", aiRoutes);
  app.use("/ai-experience-advise/*", aiRoutes);
  app.use("/ai-experience-split/*", aiRoutes);
  app.use("/ai-combine-recommend/*", aiRoutes);
  app.use("/ai-check-gaps/*", aiRoutes);

  app.route("/settings", settingsRoutes);
  app.route("/profiles", profilesRoutes);
  app.route("/companies", companiesRoutes);
  app.route("/experiences", experiencesRoutes);
  app.route("/ai-resume", aiResumeRoutes);
  app.route("/ai-verdict", aiVerdictRoutes);
  app.route("/ai-jd-meta", aiJdMetaRoutes);
  app.route("/ai-evaluate", aiEvaluateRoutes);
  app.route("/ai-experience-advise", aiExperienceAdviseRoutes);
  app.route("/ai-experience-split", aiExperienceSplitRoutes);
  app.route("/ai-combine-recommend", aiCombineRecommendRoutes);
  app.route("/ai-check-gaps", aiCheckGapsRoutes);
  app.route("/resume", resumeRoutes);
  app.route("/ai-usage", aiUsageRoutes);
  app.route("/prompts", promptsRoutes);
  app.route("/generations", generationsRoutes);
  app.route("/pce", pceRoutes);

  app.onError((err, c) => {
    if (err instanceof ApiKeyDecryptError) {
      return c.json({ error: err.message }, 400);
    }
    console.error(err);
    return c.json({ error: "Internal server error." }, 500);
  });

  return app;
}
