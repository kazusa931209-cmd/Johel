import { Prisma } from "@prisma/client";
import { Hono } from "hono";
import { z } from "zod";
import {
  DEFAULT_GENERAL_EVALUATE_PROMPT,
  DEFAULT_GENERAL_GENERATE_PROMPT,
} from "@johel/prompt-defaults";
import {
  allocateGenerationPublicId,
  GENERATION_KIND_GENERAL,
  incrementGenerationPublicId,
} from "../lib/generation-public-id";
import { prisma } from "../lib/prisma";
import { DEFAULT_GENERATION_PROCESS } from "./settings-process";
import {
  getUserCurrentGeneralGeneration,
  setUserCurrentGeneralGeneration,
} from "../lib/current-general-generation";
import { requireUser } from "../lib/session";

const GENERAL_GENERATION_STEPS = ["Combine", "Generate", "Evaluate"] as const;

const updateSchema = z.object({
  activeStep: z.enum(GENERAL_GENERATION_STEPS),
  combine: z.record(z.unknown()),
  resume: z.record(z.unknown()).nullable().optional(),
  evaluationMarkdown: z.string().nullable().optional(),
  finalized: z.boolean().optional(),
});

const EMPTY_JOB_JSON = JSON.stringify({
  method: "manual",
  jobText: "",
  acceptedMarkdown: null,
  jdCompanyName: "",
  jdJobRole: "",
});

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
  let combine: unknown = {};
  let resume: unknown = null;

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
    combine,
    resume,
    evaluationMarkdown: generation.evaluationMarkdown,
    doEvaluate: true,
    resumeLanguage: generation.resumeLanguage,
    generatePrompt: generation.generatePrompt,
    evaluatePrompt: generation.evaluatePrompt,
    createdAt: generation.createdAt.toISOString(),
    updatedAt: generation.updatedAt.toISOString(),
  };
}

export const generalGenerationsRoutes = new Hono();

const GENERATION_CREATE_MAX_ATTEMPTS = 5;

function isGenerationPublicIdConflict(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002" &&
    Array.isArray(error.meta?.target) &&
    error.meta.target.includes("publicId")
  );
}

async function loadResumeLanguage(userId: string): Promise<string> {
  const process = await prisma.generationProcess.findUnique({
    where: { userId },
  });
  return process?.resumeLanguage ?? DEFAULT_GENERATION_PROCESS.resumeLanguage;
}

generalGenerationsRoutes.post("/start", async (c) => {
  const user = await requireUser(c);
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const resumeLanguage = await loadResumeLanguage(user.id);
  const createData = {
    userId: user.id,
    kind: GENERATION_KIND_GENERAL,
    activeStep: "Combine",
    jobJson: EMPTY_JOB_JSON,
    combineJson: JSON.stringify({
      profileId: "",
      language: resumeLanguage,
      emphasis: "",
      userInstruction: "",
      companies: [],
    }),
    doVerdict: false,
    doEvaluate: true,
    resumeLanguage,
    verdictPrompt: "",
    generatePrompt: DEFAULT_GENERAL_GENERATE_PROMPT,
    evaluatePrompt: DEFAULT_GENERAL_EVALUATE_PROMPT,
  };

  let publicId = await allocateGenerationPublicId(
    user.id,
    GENERATION_KIND_GENERAL,
  );

  for (let attempt = 0; attempt < GENERATION_CREATE_MAX_ATTEMPTS; attempt += 1) {
    try {
      const generation = await prisma.generation.create({
        data: {
          publicId,
          ...createData,
        },
      });

      await setUserCurrentGeneralGeneration(user.id, generation.id);

      return c.json({
        id: generation.id,
        publicId: generation.publicId,
      });
    } catch (error) {
      if (!isGenerationPublicIdConflict(error)) {
        console.error(error);
        return c.json({ error: "Failed to start a new general resume." }, 500);
      }

      const bumped = incrementGenerationPublicId(publicId);
      if (bumped) {
        publicId = bumped;
        continue;
      }

      publicId = await allocateGenerationPublicId(
        user.id,
        GENERATION_KIND_GENERAL,
      );
    }
  }

  return c.json({ error: "Failed to allocate a generation ID." }, 500);
});

generalGenerationsRoutes.put("/:id", async (c) => {
  const user = await requireUser(c);
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const id = c.req.param("id");
  const existing = await prisma.generation.findFirst({
    where: { id, userId: user.id, kind: GENERATION_KIND_GENERAL },
  });
  if (!existing) {
    return c.json({ error: "Generation not found." }, 404);
  }

  const body = await c.req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Invalid general resume snapshot." }, 400);
  }

  const nextFinalized =
    existing.finalized || parsed.data.finalized === true;

  const generation = await prisma.generation.update({
    where: { id: existing.id },
    data: {
      activeStep: parsed.data.activeStep,
      combineJson: JSON.stringify(parsed.data.combine),
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

  await setUserCurrentGeneralGeneration(user.id, generation.id);

  return c.json(toDetailResponse(generation));
});

generalGenerationsRoutes.get("/current", async (c) => {
  const user = await requireUser(c);
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const generation = await getUserCurrentGeneralGeneration(user.id);
  if (!generation) {
    return c.json(null);
  }

  return c.json(toDetailResponse(generation));
});

generalGenerationsRoutes.post("/:publicId/resume", async (c) => {
  const user = await requireUser(c);
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const publicId = c.req.param("publicId");
  const generation = await prisma.generation.findFirst({
    where: {
      userId: user.id,
      publicId,
      kind: GENERATION_KIND_GENERAL,
    },
  });
  if (!generation) {
    return c.json({ error: "Generation not found." }, 404);
  }

  const body = await c.req.json().catch(() => ({}));
  const archive = updateSchema
    .extend({ generationId: z.string() })
    .optional()
    .safeParse(body.archive);

  if (archive.success && archive.data) {
    const source = await prisma.generation.findFirst({
      where: {
        id: archive.data.generationId,
        userId: user.id,
        kind: GENERATION_KIND_GENERAL,
      },
    });
    if (source) {
      await prisma.generation.update({
        where: { id: source.id },
        data: {
          activeStep: archive.data.activeStep,
          combineJson: JSON.stringify(archive.data.combine),
          resumeJson:
            archive.data.resume !== undefined
              ? archive.data.resume
                ? JSON.stringify(archive.data.resume)
                : null
              : source.resumeJson,
          evaluationMarkdown:
            archive.data.evaluationMarkdown !== undefined
              ? archive.data.evaluationMarkdown
              : source.evaluationMarkdown,
          finalized: true,
        },
      });
    }
  }

  await prisma.generation.update({
    where: { id: generation.id },
    data: { finalized: false },
  });

  await setUserCurrentGeneralGeneration(user.id, generation.id);

  return c.json(toDetailResponse(generation));
});

generalGenerationsRoutes.get("/:publicId", async (c) => {
  const user = await requireUser(c);
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const publicId = c.req.param("publicId");
  const generation = await prisma.generation.findFirst({
    where: {
      userId: user.id,
      publicId,
      kind: GENERATION_KIND_GENERAL,
    },
  });
  if (!generation) {
    return c.json({ error: "Generation not found." }, 404);
  }

  return c.json(toDetailResponse(generation));
});
