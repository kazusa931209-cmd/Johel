import { Hono } from "hono";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireUser } from "../lib/session.js";
import { buildWorkflowGenerationFingerprint } from "../lib/resume/generation-fingerprint.js";
import {
  listResponsePageSize,
  parseListPagination,
} from "../lib/list-pagination.js";

const PAGE_SIZE = 10;

const LANGUAGES = ["en", "ja", "zh-TW", "zh-CN", "ko"] as const;

const writeSchema = z.object({
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).optional().nullable(),
  language: z.enum(LANGUAGES),
  profileId: z.string().trim().min(1),
  companyIds: z.array(z.string().trim().min(1)).min(1),
  experienceIds: z.array(z.string().trim().min(1)).min(1),
});

type WorkflowWithRelations = {
  id: string;
  name: string;
  description: string | null;
  language: string;
  profileId: string | null;
  createdAt: Date;
  updatedAt: Date;
  companies: { companyId: string; sortOrder: number }[];
  experiences: { experienceId: string; sortOrder: number }[];
};

export const workflowsRoutes = new Hono();

const relationsInclude = {
  companies: { orderBy: { sortOrder: "asc" as const } },
  experiences: { orderBy: { sortOrder: "asc" as const } },
};

function uniqueIds(ids: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const id of ids) {
    if (seen.has(id)) continue;
    seen.add(id);
    result.push(id);
  }
  return result;
}

async function validatePcewOwnership(
  userId: string,
  profileId: string,
  companyIds: string[],
  experienceIds: string[],
): Promise<{ ok: true } | { ok: false; error: string }> {
  const profile = await prisma.profile.findFirst({
    where: { id: profileId, userId },
    select: { id: true },
  });
  if (!profile) {
    return { ok: false, error: "Selected profile was not found." };
  }

  const companies = await prisma.company.findMany({
    where: { userId, id: { in: companyIds } },
    select: { id: true },
  });
  if (companies.length !== companyIds.length) {
    return {
      ok: false,
      error: "One or more selected companies were not found.",
    };
  }

  const experiences = await prisma.experience.findMany({
    where: { userId, id: { in: experienceIds } },
    select: { id: true },
  });
  if (experiences.length !== experienceIds.length) {
    return {
      ok: false,
      error: "One or more selected experiences were not found.",
    };
  }

  return { ok: true };
}

async function replaceWorkflowRelations(
  tx: Prisma.TransactionClient,
  workflowId: string,
  companyIds: string[],
  experienceIds: string[],
) {
  await tx.workflowCompany.deleteMany({ where: { workflowId } });
  await tx.workflowExperience.deleteMany({ where: { workflowId } });

  if (companyIds.length > 0) {
    await tx.workflowCompany.createMany({
      data: companyIds.map((companyId, index) => ({
        workflowId,
        companyId,
        sortOrder: index,
      })),
    });
  }

  if (experienceIds.length > 0) {
    await tx.workflowExperience.createMany({
      data: experienceIds.map((experienceId, index) => ({
        workflowId,
        experienceId,
        sortOrder: index,
      })),
    });
  }
}

function toListItem(row: {
  id: string;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toDetail(row: WorkflowWithRelations) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    language: row.language,
    profileId: row.profileId ?? "",
    companyIds: [...row.companies]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((item) => item.companyId),
    experienceIds: [...row.experiences]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((item) => item.experienceId),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

workflowsRoutes.get("/", async (c) => {
  const user = await requireUser(c);
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const pagination = parseListPagination(
    c.req.query("page"),
    c.req.query("limit"),
    PAGE_SIZE,
  );
  const q = (c.req.query("q") ?? "").trim();

  const searchFilter: Prisma.WorkflowWhereInput = q
    ? {
        OR: [
          { name: { contains: q } },
          { description: { contains: q } },
        ],
      }
    : {};

  const where: Prisma.WorkflowWhereInput = {
    userId: user.id,
    ...searchFilter,
  };

  const [total, rows] = await prisma.$transaction([
    prisma.workflow.count({ where }),
    prisma.workflow.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      ...(pagination.skip != null ? { skip: pagination.skip } : {}),
      ...(pagination.take != null ? { take: pagination.take } : {}),
    }),
  ]);

  const items = rows.map((row) => toListItem(row));
  const pageSize = listResponsePageSize(pagination, total);

  return c.json({ items, total, page: pagination.page, pageSize });
});

workflowsRoutes.get("/:id/generation-fingerprint", async (c) => {
  const user = await requireUser(c);
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const id = c.req.param("id");
  const existing = await prisma.workflow.findFirst({
    where: { id, userId: user.id },
    select: { id: true },
  });
  if (!existing) {
    return c.json({ error: "Not found" }, 404);
  }

  try {
    const fingerprint = await buildWorkflowGenerationFingerprint(user.id, id);
    return c.json({ fingerprint });
  } catch (err) {
    const message =
      err instanceof Error && err.message
        ? err.message
        : "Workflow generation fingerprint could not be loaded.";
    return c.json({ error: message }, 400);
  }
});

workflowsRoutes.get("/:id", async (c) => {
  const user = await requireUser(c);
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const id = c.req.param("id");
  const row = await prisma.workflow.findFirst({
    where: { id, userId: user.id },
    include: relationsInclude,
  });
  if (!row) {
    return c.json({ error: "Not found" }, 404);
  }

  return c.json(toDetail(row));
});

workflowsRoutes.post("/", async (c) => {
  const user = await requireUser(c);
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const body = await c.req.json().catch(() => null);
  const parsed = writeSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Invalid workflow payload" }, 400);
  }

  const companyIds = uniqueIds(parsed.data.companyIds);
  const experienceIds = uniqueIds(parsed.data.experienceIds);

  const ownership = await validatePcewOwnership(
    user.id,
    parsed.data.profileId,
    companyIds,
    experienceIds,
  );
  if (!ownership.ok) {
    return c.json({ error: ownership.error }, 400);
  }

  const row = await prisma.$transaction(async (tx) => {
    const created = await tx.workflow.create({
      data: {
        userId: user.id,
        profileId: parsed.data.profileId,
        name: parsed.data.name,
        description: parsed.data.description || null,
        language: parsed.data.language,
      },
    });
    await replaceWorkflowRelations(
      tx,
      created.id,
      companyIds,
      experienceIds,
    );
    return tx.workflow.findUniqueOrThrow({
      where: { id: created.id },
      include: relationsInclude,
    });
  });

  return c.json(toDetail(row), 201);
});

workflowsRoutes.put("/:id", async (c) => {
  const user = await requireUser(c);
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const id = c.req.param("id");
  const existing = await prisma.workflow.findFirst({
    where: { id, userId: user.id },
  });
  if (!existing) {
    return c.json({ error: "Not found" }, 404);
  }

  const body = await c.req.json().catch(() => null);
  const parsed = writeSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Invalid workflow payload" }, 400);
  }

  const companyIds = uniqueIds(parsed.data.companyIds);
  const experienceIds = uniqueIds(parsed.data.experienceIds);

  const ownership = await validatePcewOwnership(
    user.id,
    parsed.data.profileId,
    companyIds,
    experienceIds,
  );
  if (!ownership.ok) {
    return c.json({ error: ownership.error }, 400);
  }

  const row = await prisma.$transaction(async (tx) => {
    await tx.workflow.update({
      where: { id },
      data: {
        profileId: parsed.data.profileId,
        name: parsed.data.name,
        description: parsed.data.description || null,
        language: parsed.data.language,
      },
    });
    await replaceWorkflowRelations(tx, id, companyIds, experienceIds);
    return tx.workflow.findUniqueOrThrow({
      where: { id },
      include: relationsInclude,
    });
  });

  return c.json(toDetail(row));
});

workflowsRoutes.delete("/:id", async (c) => {
  const user = await requireUser(c);
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const id = c.req.param("id");
  const existing = await prisma.workflow.findFirst({
    where: { id, userId: user.id },
  });
  if (!existing) {
    return c.json({ error: "Not found" }, 404);
  }

  await prisma.workflow.delete({ where: { id } });
  return c.json({ ok: true });
});
