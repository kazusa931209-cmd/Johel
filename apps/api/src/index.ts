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

const port = Number(process.env.PORT ?? 4042);

serve({ fetch: app.fetch, hostname: "127.0.0.1", port }, (info) => {
  console.log(`API listening on http://127.0.0.1:${info.port}`);
});
