import { Hono } from "hono";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireUser } from "../lib/session.js";

const PAGE_SIZE = 10;

const metadataItemSchema = z.object({
  key: z.string().trim().min(1).max(200),
  value: z.string().trim().max(2000),
});

const writeSchema = z.object({
  category: z.string().trim().min(1).max(200),
  description: z.string().trim().min(1).max(20000),
  metadata: z.array(metadataItemSchema).max(100),
});

type MetadataItem = {
  key: string;
  value: string;
};

type ExperienceWithMetadata = {
  id: string;
  category: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
  metadata: {
    key: string;
    value: string;
    sortOrder: number;
  }[];
};

export const experiencesRoutes = new Hono();

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
      value: item.value.trim(),
    });
  }
  return { ok: true, value: normalized };
}

function mapMetadata(
  metadata: ExperienceWithMetadata["metadata"],
): MetadataItem[] {
  return [...metadata]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((item) => ({
      key: item.key,
      value: item.value,
    }));
}

function toDetail(row: ExperienceWithMetadata) {
  return {
    id: row.id,
    category: row.category,
    description: row.description,
    metadata: mapMetadata(row.metadata),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

const metadataInclude = {
  metadata: { orderBy: { sortOrder: "asc" as const } },
};

async function replaceMetadata(
  tx: Prisma.TransactionClient,
  experienceId: string,
  items: MetadataItem[],
) {
  await tx.experienceMetadata.deleteMany({ where: { experienceId } });
  if (items.length === 0) return;
  await tx.experienceMetadata.createMany({
    data: items.map((item, index) => ({
      experienceId,
      key: item.key,
      value: item.value,
      sortOrder: index,
    })),
  });
}

experiencesRoutes.get("/", async (c) => {
  const user = await requireUser(c);
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const page = Math.max(1, Number(c.req.query("page") ?? "1") || 1);
  const q = (c.req.query("q") ?? "").trim();
  const skip = (page - 1) * PAGE_SIZE;

  const searchFilter: Prisma.ExperienceWhereInput = q
    ? {
        OR: [
          { category: { contains: q } },
          { description: { contains: q } },
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
      include: metadataInclude,
      orderBy: { updatedAt: "desc" },
      skip,
      take: PAGE_SIZE,
    }),
  ]);

  const items = rows.map((row) => toDetail(row));
  return c.json({ items, total, page, pageSize: PAGE_SIZE });
});

experiencesRoutes.get("/:id", async (c) => {
  const user = await requireUser(c);
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const id = c.req.param("id");
  const row = await prisma.experience.findFirst({
    where: { id, userId: user.id },
    include: metadataInclude,
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

  const metadata = normalizeMetadata(parsed.data.metadata);
  if (!metadata.ok) {
    return c.json({ error: metadata.error }, 400);
  }

  const row = await prisma.$transaction(async (tx) => {
    const created = await tx.experience.create({
      data: {
        userId: user.id,
        category: parsed.data.category,
        description: parsed.data.description,
      },
    });
    await replaceMetadata(tx, created.id, metadata.value);
    return tx.experience.findUniqueOrThrow({
      where: { id: created.id },
      include: metadataInclude,
    });
  });

  return c.json(toDetail(row), 201);
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

  const metadata = normalizeMetadata(parsed.data.metadata);
  if (!metadata.ok) {
    return c.json({ error: metadata.error }, 400);
  }

  const row = await prisma.$transaction(async (tx) => {
    await tx.experience.update({
      where: { id },
      data: {
        category: parsed.data.category,
        description: parsed.data.description,
      },
    });
    await replaceMetadata(tx, id, metadata.value);
    return tx.experience.findUniqueOrThrow({
      where: { id },
      include: metadataInclude,
    });
  });

  return c.json(toDetail(row));
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
