import { Hono } from "hono";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireUser } from "../lib/session.js";
import { aggregateWorkflowUsed } from "../lib/workflowUsed.js";

const PAGE_SIZE = 10;

const LANGUAGES = ["en", "ja", "zh-TW", "zh-CN", "ko"] as const;

const metadataItemSchema = z.object({
  key: z.string().trim().min(1).max(200),
  rulePrompt: z.string().trim().max(1024).optional().nullable(),
});

const writeSchema = z.object({
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).optional().nullable(),
  language: z.enum(LANGUAGES),
  filteringPrompt: z.string().trim().min(1).max(10000),
  metadata: z.array(metadataItemSchema).max(100),
});

type MetadataItem = {
  key: string;
  rulePrompt: string | null;
};

type WorkflowWithMetadata = {
  id: string;
  name: string;
  description: string | null;
  language: string;
  filteringPrompt: string;
  createdAt: Date;
  updatedAt: Date;
  metadata: {
    key: string;
    rulePrompt: string | null;
    sortOrder: number;
  }[];
};

export const workflowsRoutes = new Hono();

function normalizeMetadata(
  items: z.infer<typeof writeSchema>["metadata"],
): { ok: true; value: MetadataItem[] } | { ok: false; error: string } {
  const normalized: MetadataItem[] = [];
  const seen = new Set<string>();
  for (const item of items) {
    const key = item.key.trim();
    const keyLower = key.toLowerCase();
    if (seen.has(keyLower)) {
      return { ok: false, error: "Metadata keys must be unique" };
    }
    seen.add(keyLower);
    normalized.push({
      key,
      rulePrompt: item.rulePrompt?.trim() ? item.rulePrompt.trim() : null,
    });
  }
  return { ok: true, value: normalized };
}

function toListItem(
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

function toDetail(row: WorkflowWithMetadata, used: number) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    language: row.language,
    filteringPrompt: row.filteringPrompt,
    metadata: [...row.metadata]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((item) => ({
        key: item.key,
        rulePrompt: item.rulePrompt,
      })),
    used,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

const metadataInclude = {
  metadata: { orderBy: { sortOrder: "asc" as const } },
};

async function replaceMetadata(
  tx: Prisma.TransactionClient,
  workflowId: string,
  items: MetadataItem[],
) {
  await tx.workflowMetadata.deleteMany({ where: { workflowId } });
  if (items.length === 0) return;
  await tx.workflowMetadata.createMany({
    data: items.map((item, index) => ({
      workflowId,
      key: item.key,
      rulePrompt: item.rulePrompt,
      sortOrder: index,
    })),
  });
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
  const items = rows.map((row) => toListItem(row, usedById.get(row.id) ?? 0));

  return c.json({ items, total, page, pageSize: PAGE_SIZE });
});

workflowsRoutes.get("/:id", async (c) => {
  const user = await requireUser(c);
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const id = c.req.param("id");
  const row = await prisma.workflow.findFirst({
    where: { id, userId: user.id },
    include: metadataInclude,
  });
  if (!row) {
    return c.json({ error: "Not found" }, 404);
  }

  const usedById = await aggregateWorkflowUsed([row.id]);
  return c.json(toDetail(row, usedById.get(row.id) ?? 0));
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

  const metadata = normalizeMetadata(parsed.data.metadata);
  if (!metadata.ok) {
    return c.json({ error: metadata.error }, 400);
  }

  const row = await prisma.$transaction(async (tx) => {
    const created = await tx.workflow.create({
      data: {
        userId: user.id,
        name: parsed.data.name,
        description: parsed.data.description || null,
        language: parsed.data.language,
        filteringPrompt: parsed.data.filteringPrompt,
      },
    });
    await replaceMetadata(tx, created.id, metadata.value);
    return tx.workflow.findUniqueOrThrow({
      where: { id: created.id },
      include: metadataInclude,
    });
  });

  const usedById = await aggregateWorkflowUsed([row.id]);
  return c.json(toDetail(row, usedById.get(row.id) ?? 0), 201);
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

  const metadata = normalizeMetadata(parsed.data.metadata);
  if (!metadata.ok) {
    return c.json({ error: metadata.error }, 400);
  }

  const row = await prisma.$transaction(async (tx) => {
    await tx.workflow.update({
      where: { id },
      data: {
        name: parsed.data.name,
        description: parsed.data.description || null,
        language: parsed.data.language,
        filteringPrompt: parsed.data.filteringPrompt,
      },
    });
    await replaceMetadata(tx, id, metadata.value);
    return tx.workflow.findUniqueOrThrow({
      where: { id },
      include: metadataInclude,
    });
  });

  const usedById = await aggregateWorkflowUsed([row.id]);
  return c.json(toDetail(row, usedById.get(row.id) ?? 0));
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
