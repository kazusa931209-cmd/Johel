import { Hono } from "hono";
import { z } from "zod";
import { allocateGenerationPublicId } from "../lib/generation-public-id.js";
import {
  listResponsePageSize,
  parseListPagination,
} from "../lib/list-pagination.js";
import { prisma } from "../lib/prisma.js";
import { DEFAULT_GENERATION_PROCESS } from "./settings-process.js";
import { requireUser } from "../lib/session.js";

const PAGE_SIZE = 10;

const GENERATION_STATUSES = ["in_progress", "completed", "finalized"] as const;
const GENERATION_STEPS = [
  "Job",
  "Verdict",
  "Combine",
  "Generate",
  "Evaluate",
] as const;

const updateSchema = z.object({
  activeStep: z.enum(GENERATION_STEPS),
  job: z.record(z.unknown()),
  combine: z.record(z.unknown()),
  verdictMarkdown: z.string().nullable().optional(),
  resume: z.record(z.unknown()).nullable().optional(),
  evaluationMarkdown: z.string().nullable().optional(),
  status: z.enum(GENERATION_STATUSES).optional(),
});

function toListItem(generation: {
  id: string;
  publicId: string;
  status: string;
  inputToken: number;
  outputToken: number;
  createdAt: Date;
}) {
  return {
    id: generation.id,
    publicId: generation.publicId,
    status: generation.status,
    inputToken: generation.inputToken,
    outputToken: generation.outputToken,
    tokenUsed: generation.inputToken + generation.outputToken,
    createdAt: generation.createdAt.toISOString(),
  };
}

function toDetailResponse(generation: {
  id: string;
  publicId: string;
  status: string;
  inputToken: number;
  outputToken: number;
  activeStep: string;
  jobJson: string;
  combineJson: string;
  verdictMarkdown: string | null;
  resumeJson: string | null;
  evaluationMarkdown: string | null;
  doVerdict: boolean;
  doEvaluate: boolean;
  resumeLanguage: string;
  verdictPrompt: string;
  generatePrompt: string;
  evaluatePrompt: string;
  createdAt: Date;
  updatedAt: Date;
}) {
  let job: unknown = {};
  let combine: unknown = {};
  let resume: unknown = null;

  try {
    job = JSON.parse(generation.jobJson);
  } catch {
    job = {};
  }
  try {
    combine = JSON.parse(generation.combineJson);
  } catch {
    combine = {};
  }
  if (generation.resumeJson) {
    try {
      resume = JSON.parse(generation.resumeJson);
    } catch {
      resume = null;
    }
  }

  return {
    id: generation.id,
    publicId: generation.publicId,
    status: generation.status,
    inputToken: generation.inputToken,
    outputToken: generation.outputToken,
    tokenUsed: generation.inputToken + generation.outputToken,
    activeStep: generation.activeStep,
    job,
    combine,
    verdictMarkdown: generation.verdictMarkdown,
    resume,
    evaluationMarkdown: generation.evaluationMarkdown,
    doVerdict: generation.doVerdict,
    doEvaluate: generation.doEvaluate,
    resumeLanguage: generation.resumeLanguage,
    verdictPrompt: generation.verdictPrompt,
    generatePrompt: generation.generatePrompt,
    evaluatePrompt: generation.evaluatePrompt,
    createdAt: generation.createdAt.toISOString(),
    updatedAt: generation.updatedAt.toISOString(),
  };
}

async function loadPromptAndProcess(userId: string) {
  const [prompts, process] = await Promise.all([
    prisma.prompt.findUnique({ where: { userId } }),
    prisma.generationProcess.findUnique({ where: { userId } }),
  ]);

  return {
    doVerdict: process?.doVerdict ?? DEFAULT_GENERATION_PROCESS.doVerdict,
    doEvaluate: process?.doEvaluate ?? DEFAULT_GENERATION_PROCESS.doEvaluate,
    resumeLanguage:
      process?.resumeLanguage ?? DEFAULT_GENERATION_PROCESS.resumeLanguage,
    verdictPrompt: prompts?.verdictPrompt ?? "",
    generatePrompt: prompts?.generatePrompt ?? "",
    evaluatePrompt: prompts?.evaluatePrompt ?? "",
  };
}

export const generationsRoutes = new Hono();

generationsRoutes.post("/start", async (c) => {
  const user = await requireUser(c);
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const settings = await loadPromptAndProcess(user.id);
  const publicId = await allocateGenerationPublicId(user.id);

  const generation = await prisma.generation.create({
    data: {
      publicId,
      userId: user.id,
      status: "in_progress",
      activeStep: "Job",
      jobJson: JSON.stringify({
        method: "manual",
        jobText: "",
        acceptedMarkdown: null,
      }),
      combineJson: JSON.stringify({
        profileId: "",
        language: settings.resumeLanguage,
        emphasis: "",
        companies: [],
      }),
      doVerdict: settings.doVerdict,
      doEvaluate: settings.doEvaluate,
      resumeLanguage: settings.resumeLanguage,
      verdictPrompt: settings.verdictPrompt,
      generatePrompt: settings.generatePrompt,
      evaluatePrompt: settings.evaluatePrompt,
    },
  });

  return c.json({
    id: generation.id,
    publicId: generation.publicId,
  });
});

generationsRoutes.put("/:id", async (c) => {
  const user = await requireUser(c);
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const id = c.req.param("id");
  const existing = await prisma.generation.findFirst({
    where: { id, userId: user.id },
  });
  if (!existing) {
    return c.json({ error: "Generation not found." }, 404);
  }

  const body = await c.req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Invalid generation snapshot." }, 400);
  }

  const requestedStatus = parsed.data.status;
  const nextStatus =
    existing.status === "finalized"
      ? "finalized"
      : requestedStatus === "finalized"
        ? "finalized"
        : requestedStatus ??
          (existing.status === "completed" || existing.status === "finalized"
            ? existing.status
            : "in_progress");

  const generation = await prisma.generation.update({
    where: { id: existing.id },
    data: {
      activeStep: parsed.data.activeStep,
      jobJson: JSON.stringify(parsed.data.job),
      combineJson: JSON.stringify(parsed.data.combine),
      verdictMarkdown:
        parsed.data.verdictMarkdown !== undefined
          ? parsed.data.verdictMarkdown
          : existing.verdictMarkdown,
      resumeJson:
        parsed.data.resume !== undefined
          ? parsed.data.resume
            ? JSON.stringify(parsed.data.resume)
            : null
          : existing.resumeJson,
      evaluationMarkdown:
        parsed.data.evaluationMarkdown !== undefined
          ? parsed.data.evaluationMarkdown
          : existing.evaluationMarkdown,
      status: nextStatus,
    },
  });

  return c.json(toDetailResponse(generation));
});

generationsRoutes.get("/", async (c) => {
  const user = await requireUser(c);
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const q = (c.req.query("q") ?? "").trim();
  const pagination = parseListPagination(
    c.req.query("page"),
    c.req.query("limit"),
    PAGE_SIZE,
  );

  const where = {
    userId: user.id,
    ...(q
      ? {
          OR: [
            { publicId: { contains: q } },
            { jobJson: { contains: q } },
            { verdictPrompt: { contains: q } },
            { generatePrompt: { contains: q } },
            { evaluatePrompt: { contains: q } },
          ],
        }
      : {}),
  };

  const [total, items] = await Promise.all([
    prisma.generation.count({ where }),
    pagination.pageSize === 0
      ? prisma.generation.findMany({
          where,
          orderBy: { createdAt: "desc" },
        })
      : prisma.generation.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip: pagination.skip,
          take: pagination.take,
        }),
  ]);

  const pageSize = listResponsePageSize(pagination, total);
  return c.json({
    items: items.map(toListItem),
    total,
    page: pagination.page,
    pageSize,
  });
});

generationsRoutes.get("/:publicId", async (c) => {
  const user = await requireUser(c);
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const publicId = c.req.param("publicId");
  const generation = await prisma.generation.findFirst({
    where: { userId: user.id, publicId },
  });
  if (!generation) {
    return c.json({ error: "Generation not found." }, 404);
  }

  return c.json(toDetailResponse(generation));
});
