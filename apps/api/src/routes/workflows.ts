import { Hono } from "hono";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireUser } from "../lib/session.js";
import { aggregateWorkflowUsed } from "../lib/workflowUsed.js";

const PAGE_SIZE = 10;

const writeSchema = z.object({
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).optional().nullable(),
});

export const workflowsRoutes = new Hono();

function toItem(
  row: {
    id: string;
    name: string;
    description: string | null;
    createdAt: Date;
    updatedAt: Date;
  },
  used: number,
) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    used,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

workflowsRoutes.get("/", async (c) => {
  const user = await requireUser(c);
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const page = Math.max(1, Number(c.req.query("page") ?? "1") || 1);
  const q = (c.req.query("q") ?? "").trim();
  const skip = (page - 1) * PAGE_SIZE;

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
      skip,
      take: PAGE_SIZE,
    }),
  ]);

  const usedById = await aggregateWorkflowUsed(rows.map((row) => row.id));
  const items = rows.map((row) => toItem(row, usedById.get(row.id) ?? 0));

  return c.json({ items, total, page, pageSize: PAGE_SIZE });
});

workflowsRoutes.post("/", async (c) => {
  const user = await requireUser(c);
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const body = await c.req.json().catch(() => null);
  const parsed = writeSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Invalid name or description" }, 400);
  }

  const row = await prisma.workflow.create({
    data: {
      userId: user.id,
      name: parsed.data.name,
      description: parsed.data.description || null,
    },
  });

  const usedById = await aggregateWorkflowUsed([row.id]);
  return c.json(toItem(row, usedById.get(row.id) ?? 0), 201);
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
    return c.json({ error: "Invalid name or description" }, 400);
  }

  const row = await prisma.workflow.update({
    where: { id },
    data: {
      name: parsed.data.name,
      description: parsed.data.description || null,
    },
  });

  const usedById = await aggregateWorkflowUsed([row.id]);
  return c.json(toItem(row, usedById.get(row.id) ?? 0));
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
