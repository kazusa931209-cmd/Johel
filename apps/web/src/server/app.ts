import { Hono } from "hono";
import { cors } from "hono/cors";
import type { MiddlewareHandler } from "hono";

type AppVariables = {
  rateLimitUserId: string;
};
import { validateDeployConfig } from "./lib/deploy-config";
import { ApiKeyDecryptError } from "./lib/secrets/api-key";
import { requireUser } from "./lib/session";
import {
  aiRateLimit,
  authLoginRateLimit,
  authPasswordRateLimit,
  authRegisterRateLimit,
  defaultApiRateLimit,
} from "./lib/rate-limit";
import { authRoutes } from "./routes/auth";
import { healthRoutes } from "./routes/health";
import { settingsRoutes } from "./routes/settings";
import { profilesRoutes } from "./routes/profiles";
import { companiesRoutes } from "./routes/companies";
import { experiencesRoutes } from "./routes/experiences";
import { aiEvaluateRoutes } from "./routes/ai-evaluate";
import { aiResumeRoutes } from "./routes/ai-resume";
import { aiJdMetaRoutes } from "./routes/ai-jd-meta";
import { aiVerdictRoutes } from "./routes/ai-verdict";
import { aiCombineRecommendRoutes } from "./routes/ai-combine-recommend";
import { resumeRoutes } from "./routes/resume";
import { aiUsageRoutes } from "./routes/ai-usage";
import { promptsRoutes } from "./routes/prompts";
import { aiExperienceAdviseRoutes } from "./routes/ai-experience-advise";
import { aiExperienceSplitRoutes } from "./routes/ai-experience-split";
import { aiCheckOnExperiencesRoutes } from "./routes/ai-check-on-experiences";
import { generationsRoutes } from "./routes/generations";
import { pceRoutes } from "./routes/pce";

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
  app.use("/ai-check-on-experiences/*", aiRoutes);

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
  app.route("/ai-check-on-experiences", aiCheckOnExperiencesRoutes);
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
