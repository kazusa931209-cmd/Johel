import { Hono } from "hono";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { finalizeExperienceFieldsForAdvisorApply } from "../lib/ai-experience-advise/apply.js";
import { syncExperienceEmbeddingAfterSave } from "../lib/experience-embedding/sync-after-save.js";
import { prisma } from "../lib/prisma.js";
import { requireUser } from "../lib/session.js";
import {
  listResponsePageSize,
  parseListPagination,
} from "../lib/list-pagination.js";

const PAGE_SIZE = 10;

const writeSchema = z.object({
  category: z.string().trim().min(1).max(200),
  problem: z.string().trim().min(1).max(20000),
  actions: z.string().trim().min(1).max(20000),
  outcome: z.string().trim().min(1).max(20000),
});

type ExperienceRow = {
  id: string;
  category: string;
  problem: string;
  actions: string;
  outcome: string;
  createdAt: Date;
  updatedAt: Date;
};

export const experiencesRoutes = new Hono();

function toDetail(row: ExperienceRow) {
  return {
    id: row.id,
    category: row.category,
    problem: row.problem,
    actions: row.actions,
    outcome: row.outcome,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

experiencesRoutes.get("/", async (c) => {
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

  const searchFilter: Prisma.ExperienceWhereInput = q
    ? {
        OR: [
          { category: { contains: q } },
          { problem: { contains: q } },
          { actions: { contains: q } },
          { outcome: { contains: q } },
        ],
      }
    : {};

  const where: Prisma.ExperienceWhereInput = {
    userId: user.id,
    ...searchFilter,
  };

  const [total, rows] = await prisma.$transaction([
    prisma.experience.count({ where }),
    prisma.experience.findMany({
      where,
      orderBy: { category: "asc" },
      ...(pagination.skip != null ? { skip: pagination.skip } : {}),
      ...(pagination.take != null ? { take: pagination.take } : {}),
    }),
  ]);

  const items = rows.map((row) => toDetail(row));
  const pageSize = listResponsePageSize(pagination, total);
  return c.json({ items, total, page: pagination.page, pageSize });
});

experiencesRoutes.get("/:id", async (c) => {
  const user = await requireUser(c);
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const id = c.req.param("id");
  const row = await prisma.experience.findFirst({
    where: { id, userId: user.id },
  });
  if (!row) {
    return c.json({ error: "Not found" }, 404);
  }

  return c.json(toDetail(row));
});

experiencesRoutes.post("/", async (c) => {
  const user = await requireUser(c);
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const body = await c.req.json().catch(() => null);
  const parsed = writeSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Invalid experience payload" }, 400);
  }

  try {
    const formatted = finalizeExperienceFieldsForAdvisorApply({
      problem: parsed.data.problem,
      actions: parsed.data.actions,
      outcome: parsed.data.outcome,
    });

    const row = await prisma.experience.create({
      data: {
        userId: user.id,
        category: parsed.data.category,
        problem: formatted.problem,
        actions: formatted.actions,
        outcome: formatted.outcome,
      },
    });

    await syncExperienceEmbeddingAfterSave({
      userId: user.id,
      experienceId: row.id,
      category: row.category,
      problem: row.problem,
      actions: row.actions,
      outcome: row.outcome,
    });

    return c.json(toDetail(row), 201);
  } catch (err) {
    const message =
      err instanceof Error && err.message
        ? err.message
        : "Markdown conversion failed. Please try again.";
    return c.json({ error: message }, 502);
  }
});

experiencesRoutes.put("/:id", async (c) => {
  const user = await requireUser(c);
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const id = c.req.param("id");
  const existing = await prisma.experience.findFirst({
    where: { id, userId: user.id },
  });
  if (!existing) {
    return c.json({ error: "Not found" }, 404);
  }

  const body = await c.req.json().catch(() => null);
  const parsed = writeSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Invalid experience payload" }, 400);
  }

  try {
    const formatted = finalizeExperienceFieldsForAdvisorApply({
      problem: parsed.data.problem,
      actions: parsed.data.actions,
      outcome: parsed.data.outcome,
    });

    const row = await prisma.experience.update({
      where: { id },
      data: {
        category: parsed.data.category,
        problem: formatted.problem,
        actions: formatted.actions,
        outcome: formatted.outcome,
      },
    });

    await syncExperienceEmbeddingAfterSave({
      userId: user.id,
      experienceId: row.id,
      category: row.category,
      problem: row.problem,
      actions: row.actions,
      outcome: row.outcome,
    });

    return c.json(toDetail(row));
  } catch (err) {
    const message =
      err instanceof Error && err.message
        ? err.message
        : "Markdown conversion failed. Please try again.";
    return c.json({ error: message }, 502);
  }
});

experiencesRoutes.delete("/:id", async (c) => {
  const user = await requireUser(c);
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const id = c.req.param("id");
  const existing = await prisma.experience.findFirst({
    where: { id, userId: user.id },
  });
  if (!existing) {
    return c.json({ error: "Not found" }, 404);
  }

  await prisma.experience.delete({ where: { id } });
  return c.json({ ok: true });
});
