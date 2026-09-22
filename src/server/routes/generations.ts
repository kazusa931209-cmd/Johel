import { Prisma } from "@prisma/client";
import { Hono } from "hono";
import { z } from "zod";
import { deriveProcessedStep } from "../lib/generation-processed-step";
import {
  allocateGenerationPublicId,
  GENERATION_KIND_JD,
  incrementGenerationPublicId,
} from "../lib/generation-public-id";
import { findJobDuplicateMatch } from "../lib/job-embedding/duplicate-check";
import { syncGenerationJobEmbeddingAfterSave } from "../lib/job-embedding/sync-after-save";
import {
  listResponsePageSize,
  parseListPagination,
} from "../lib/list-pagination";
import { prisma } from "../lib/prisma";
import { DEFAULT_GENERATION_PROCESS } from "./settings-process";
import {
  getUserCurrentGeneration,
  setUserCurrentGeneration,
} from "../lib/current-generation";
import {
  formatGenerationInformation,
  formatProfileName,
  parseGenerationCombineProfileId,
  parseGenerationJobJson,
} from "../lib/generation-list-info";
import { requireUser } from "../lib/session";
import { getUserAiSettings } from "../lib/user-ai-settings";

const PAGE_SIZE = 10;

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
  finalized: z.boolean().optional(),
});

const resumeSchema = z.object({
  archive: updateSchema.extend({ generationId: z.string() }).optional(),
});

type GenerationListRow = {
  id: string;
  publicId: string;
  kind: string;
  finalized: boolean;
  activeStep: string;
  jobJson: string;
  combineJson: string;
  verdictMarkdown: string | null;
  resumeJson: string | null;
  evaluationMarkdown: string | null;
  doVerdict: boolean;
  doEvaluate: boolean;
  inputToken: number;
  outputToken: number;
  updatedAt: Date;
};

function toListItem(
  generation: GenerationListRow,
  profileNameById: Map<string, string>,
) {
  const job = parseGenerationJobJson(generation.jobJson);
  const profileId = parseGenerationCombineProfileId(generation.combineJson);
  const profileName = profileId
    ? (profileNameById.get(profileId) ?? null)
    : null;

  return {
    id: generation.id,
    publicId: generation.publicId,
    kind: generation.kind,
    finalized: generation.finalized,
    processedStep: deriveProcessedStep(generation),
    doVerdict: generation.doVerdict,
    doEvaluate: generation.doEvaluate,
    inputToken: generation.inputToken,
    outputToken: generation.outputToken,
    tokenUsed: generation.inputToken + generation.outputToken,
    updatedAt: generation.updatedAt.toISOString(),
    profileName,
    jdCompanyName: job.jdCompanyName,
    jdJobRole: job.jdJobRole,
    information: formatGenerationInformation({
      profileName,
      jdCompanyName: job.jdCompanyName,
      jdJobRole: job.jdJobRole,
    }),
  };
}

async function loadProfileNamesById(
  userId: string,
  generations: GenerationListRow[],
): Promise<Map<string, string>> {
  const profileIds = new Set<string>();
  for (const generation of generations) {
    const profileId = parseGenerationCombineProfileId(generation.combineJson);
    if (profileId) {
      profileIds.add(profileId);
    }
  }

  if (profileIds.size === 0) {
    return new Map();
  }

  const profiles = await prisma.profile.findMany({
    where: {
      userId,
      id: { in: [...profileIds] },
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
    },
  });

  return new Map(
    profiles.map((profile) => [
      profile.id,
      formatProfileName(profile.firstName, profile.lastName),
    ]),
  );
}

function toDetailResponse(generation: {
  id: string;
  publicId: string;
  kind: string;
  finalized: boolean;
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
    kind: generation.kind,
    finalized: generation.finalized,
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

const GENERATION_CREATE_MAX_ATTEMPTS = 5;

function isGenerationPublicIdConflict(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002" &&
    Array.isArray(error.meta?.target) &&
    error.meta.target.includes("publicId")
  );
}

generationsRoutes.post("/start", async (c) => {
  const user = await requireUser(c);
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const settings = await loadPromptAndProcess(user.id);
  const createData = {
    userId: user.id,
    activeStep: "Job",
    jobJson: JSON.stringify({
      method: "manual",
      jobText: "",
      acceptedMarkdown: null,
      jdCompanyName: "",
      jdJobRole: "",
    }),
    combineJson: JSON.stringify({
      profileId: "",
      language: settings.resumeLanguage,
      emphasis: "",
      userInstruction: "",
      companies: [],
    }),
    kind: GENERATION_KIND_JD,
    doVerdict: settings.doVerdict,
    doEvaluate: settings.doEvaluate,
    resumeLanguage: settings.resumeLanguage,
    verdictPrompt: settings.verdictPrompt,
    generatePrompt: settings.generatePrompt,
    evaluatePrompt: settings.evaluatePrompt,
  };

  let publicId = await allocateGenerationPublicId(user.id, GENERATION_KIND_JD);

  for (let attempt = 0; attempt < GENERATION_CREATE_MAX_ATTEMPTS; attempt += 1) {
    try {
      const generation = await prisma.generation.create({
        data: {
          publicId,
          ...createData,
        },
      });

      await setUserCurrentGeneration(user.id, generation.id);

      return c.json({
        id: generation.id,
        publicId: generation.publicId,
      });
    } catch (error) {
      if (!isGenerationPublicIdConflict(error)) {
        console.error(error);
        return c.json({ error: "Failed to start a new generation." }, 500);
      }

      const bumped = incrementGenerationPublicId(publicId);
      if (bumped) {
        publicId = bumped;
        continue;
      }

      publicId = await allocateGenerationPublicId(user.id, GENERATION_KIND_JD);
    }
  }

  return c.json({ error: "Failed to allocate a generation ID." }, 500);
});

generationsRoutes.put("/:id", async (c) => {
  const user = await requireUser(c);
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const id = c.req.param("id");
  const existing = await prisma.generation.findFirst({
    where: { id, userId: user.id, kind: GENERATION_KIND_JD },
  });
  if (!existing) {
    return c.json({ error: "Generation not found." }, 404);
  }

  const body = await c.req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Invalid generation snapshot." }, 400);
  }

  const nextFinalized =
    existing.finalized || parsed.data.finalized === true;

  const jobJson = JSON.stringify(parsed.data.job);

  const generation = await prisma.generation.update({
    where: { id: existing.id },
    data: {
      activeStep: parsed.data.activeStep,
      jobJson,
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
      finalized: nextFinalized,
    },
  });

  try {
    await syncGenerationJobEmbeddingAfterSave({
      userId: user.id,
      generationId: generation.id,
      jobJson,
    });
  } catch (err) {
    console.error("Job embedding sync skipped after generation save:", err);
  }

  await setUserCurrentGeneration(user.id, generation.id);

  return c.json(toDetailResponse(generation));
});

generationsRoutes.post("/:id/job-duplicate-check", async (c) => {
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

  const aiSettings = await getUserAiSettings(user.id);
  if (!aiSettings) {
    return c.json({ error: "Configure an OpenAI API key in Settings." }, 400);
  }

  try {
    const match = await findJobDuplicateMatch({
      userId: user.id,
      apiKey: aiSettings.apiKey,
      generationId: existing.id,
    });

    if (!match) {
      return c.json({ match: null });
    }

    return c.json({
      match: {
        generationId: match.generationId,
        publicId: match.publicId,
        filteredJobText: match.filteredJobText,
        finalized: match.finalized,
        score: match.score,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Job duplicate check failed.";
    return c.json({ error: message }, 500);
  }
});

generationsRoutes.post("/:publicId/resume", async (c) => {
  const user = await requireUser(c);
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const publicId = c.req.param("publicId");
  const target = await prisma.generation.findFirst({
    where: { userId: user.id, publicId },
  });
  if (!target) {
    return c.json({ error: "Generation not found." }, 404);
  }

  const body = await c.req.json().catch(() => null);
  const parsed = resumeSchema.safeParse(body ?? {});
  if (!parsed.success) {
    return c.json({ error: "Invalid resume request." }, 400);
  }

  if (parsed.data.archive) {
    const archive = parsed.data.archive;
    const current = await prisma.generation.findFirst({
      where: { id: archive.generationId, userId: user.id },
    });
    if (current && current.id !== target.id) {
      const archiveFinalized =
        current.finalized || archive.finalized === true;

      await prisma.generation.update({
        where: { id: current.id },
        data: {
          activeStep: archive.activeStep,
          jobJson: JSON.stringify(archive.job),
          combineJson: JSON.stringify(archive.combine),
          verdictMarkdown:
            archive.verdictMarkdown !== undefined
              ? archive.verdictMarkdown
              : current.verdictMarkdown,
          resumeJson:
            archive.resume !== undefined
              ? archive.resume
                ? JSON.stringify(archive.resume)
                : null
              : current.resumeJson,
          evaluationMarkdown:
            archive.evaluationMarkdown !== undefined
              ? archive.evaluationMarkdown
              : current.evaluationMarkdown,
          finalized: archiveFinalized,
        },
      });
    }
  }

  const generation = await prisma.generation.update({
    where: { id: target.id },
    data: { finalized: false },
  });

  await setUserCurrentGeneration(user.id, generation.id);

  return c.json(toDetailResponse(generation));
});

generationsRoutes.get("/current", async (c) => {
  const user = await requireUser(c);
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const generation = await getUserCurrentGeneration(user.id);
  if (!generation) {
    return c.json(null);
  }

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
  const profileNameById = await loadProfileNamesById(user.id, items);
  return c.json({
    items: items.map((item) => toListItem(item, profileNameById)),
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
