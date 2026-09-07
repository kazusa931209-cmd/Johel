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

const periodSchema = z.string().trim().min(1).max(50);

const companyEntrySchema = z.object({
  companyId: z.string().trim().min(1),
  startDate: periodSchema,
  endDate: periodSchema,
  experienceIds: z.array(z.string().trim().min(1)).min(1),
});

const writeSchema = z.object({
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().min(1).max(2000),
  language: z.enum(LANGUAGES),
  profileId: z.string().trim().min(1),
  companies: z.array(companyEntrySchema).min(1),
});

type WorkflowWithRelations = {
  id: string;
  name: string;
  description: string;
  language: string;
  profileId: string | null;
  createdAt: Date;
  updatedAt: Date;
  companies: {
    companyId: string;
    startDate: string;
    endDate: string;
    sortOrder: number;
    experiences: { experienceId: string; sortOrder: number }[];
  }[];
};

export type WorkflowCompanyPayload = z.infer<typeof companyEntrySchema>;

export const workflowsRoutes = new Hono();

const relationsInclude = {
  companies: {
    orderBy: { sortOrder: "asc" as const },
    include: {
      experiences: { orderBy: { sortOrder: "asc" as const } },
    },
  },
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

function normalizeCompanies(
  companies: WorkflowCompanyPayload[],
): WorkflowCompanyPayload[] {
  const seenCompanyIds = new Set<string>();
  return companies.map((entry) => {
    if (seenCompanyIds.has(entry.companyId)) {
      throw new Error("Each company can appear only once in a workflow.");
    }
    seenCompanyIds.add(entry.companyId);
    return {
      companyId: entry.companyId,
      startDate: entry.startDate.trim(),
      endDate: entry.endDate.trim(),
      experienceIds: uniqueIds(entry.experienceIds),
    };
  });
}

async function validateWorkflowContentOwnership(
  userId: string,
  profileId: string,
  companies: WorkflowCompanyPayload[],
): Promise<{ ok: true } | { ok: false; error: string }> {
  const profile = await prisma.profile.findFirst({
    where: { id: profileId, userId },
    select: { id: true },
  });
  if (!profile) {
    return { ok: false, error: "Selected profile was not found." };
  }

  const companyIds = companies.map((entry) => entry.companyId);
  const experienceIds = uniqueIds(
    companies.flatMap((entry) => entry.experienceIds),
  );

  const ownedCompanies = await prisma.company.findMany({
    where: { userId, id: { in: companyIds } },
    select: { id: true },
  });
  if (ownedCompanies.length !== companyIds.length) {
    return {
      ok: false,
      error: "One or more selected companies were not found.",
    };
  }

  const ownedExperiences = await prisma.experience.findMany({
    where: { userId, id: { in: experienceIds } },
    select: { id: true },
  });
  if (ownedExperiences.length !== experienceIds.length) {
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
  companies: WorkflowCompanyPayload[],
) {
  await tx.workflowCompany.deleteMany({ where: { workflowId } });

  for (const [index, entry] of companies.entries()) {
    const workflowCompany = await tx.workflowCompany.create({
      data: {
        workflowId,
        companyId: entry.companyId,
        startDate: entry.startDate,
        endDate: entry.endDate,
        sortOrder: index,
      },
    });

    if (entry.experienceIds.length > 0) {
      await tx.workflowCompanyExperience.createMany({
        data: entry.experienceIds.map((experienceId, experienceIndex) => ({
          workflowCompanyId: workflowCompany.id,
          experienceId,
          sortOrder: experienceIndex,
        })),
      });
    }
  }
}

function toListItem(row: {
  id: string;
  name: string;
  description: string;
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
    companies: [...row.companies]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((item) => ({
        companyId: item.companyId,
        startDate: item.startDate,
        endDate: item.endDate,
        experienceIds: [...item.experiences]
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((experience) => experience.experienceId),
      })),
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

  let companies: WorkflowCompanyPayload[];
  try {
    companies = normalizeCompanies(parsed.data.companies);
  } catch (err) {
    const message =
      err instanceof Error && err.message
        ? err.message
        : "Invalid workflow companies.";
    return c.json({ error: message }, 400);
  }

  const ownership = await validateWorkflowContentOwnership(
    user.id,
    parsed.data.profileId,
    companies,
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
        description: parsed.data.description,
        language: parsed.data.language,
      },
    });
    await replaceWorkflowRelations(tx, created.id, companies);
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

  let companies: WorkflowCompanyPayload[];
  try {
    companies = normalizeCompanies(parsed.data.companies);
  } catch (err) {
    const message =
      err instanceof Error && err.message
        ? err.message
        : "Invalid workflow companies.";
    return c.json({ error: message }, 400);
  }

  const ownership = await validateWorkflowContentOwnership(
    user.id,
    parsed.data.profileId,
    companies,
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
        description: parsed.data.description,
        language: parsed.data.language,
      },
    });
    await replaceWorkflowRelations(tx, id, companies);
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
