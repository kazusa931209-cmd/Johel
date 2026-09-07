import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { authRoutes } from "./routes/auth.js";
import { healthRoutes } from "./routes/health.js";
import { settingsRoutes } from "./routes/settings.js";
import { workflowsRoutes } from "./routes/workflows.js";
import { profilesRoutes } from "./routes/profiles.js";
import { companiesRoutes } from "./routes/companies.js";
import { experiencesRoutes } from "./routes/experiences.js";
import { aiEvaluateRoutes } from "./routes/ai-evaluate.js";
import { aiResumeRoutes } from "./routes/ai-resume.js";
import { aiVerdictRoutes } from "./routes/ai-verdict.js";
import { aiWorkflowRecommendRoutes } from "./routes/ai-workflow-recommend.js";
import { resumeRoutes } from "./routes/resume.js";
import { aiUsageRoutes } from "./routes/ai-usage.js";
import { promptsRoutes } from "./routes/prompts.js";

const app = new Hono();

app.use(
  "*",
  cors({
    origin: ["http://127.0.0.1:4041", "http://localhost:4041"],
    credentials: true,
  }),
);

app.route("/health", healthRoutes);
app.route("/auth", authRoutes);
app.route("/settings", settingsRoutes);
app.route("/workflows", workflowsRoutes);
app.route("/profiles", profilesRoutes);
app.route("/companies", companiesRoutes);
app.route("/experiences", experiencesRoutes);
app.route("/ai-resume", aiResumeRoutes);
app.route("/ai-verdict", aiVerdictRoutes);
app.route("/ai-workflow-recommend", aiWorkflowRecommendRoutes);
app.route("/ai-evaluate", aiEvaluateRoutes);
app.route("/resume", resumeRoutes);
app.route("/ai-usage", aiUsageRoutes);
app.route("/prompts", promptsRoutes);

const port = Number(process.env.PORT ?? 4042);
const hostname = process.env.HOST ?? "127.0.0.1";

serve({ fetch: app.fetch, hostname, port }, (info) => {
  console.log(`API listening on http://${hostname}:${info.port}`);
});
