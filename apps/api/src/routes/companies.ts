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
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().min(1).max(20000),
  priority: z.number().int().min(1).max(1_000_000).optional(),
  metadata: z.array(metadataItemSchema).max(100),
});

type MetadataItem = {
  key: string;
  value: string;
};

type CompanyWithMetadata = {
  id: string;
  name: string;
  description: string;
  priority: number;
  createdAt: Date;
  updatedAt: Date;
  metadata: {
    key: string;
    value: string;
    sortOrder: number;
  }[];
};

export const companiesRoutes = new Hono();

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
  metadata: CompanyWithMetadata["metadata"],
): MetadataItem[] {
  return [...metadata]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((item) => ({
      key: item.key,
      value: item.value,
    }));
}

function toDetail(row: CompanyWithMetadata) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    priority: row.priority,
    metadata: mapMetadata(row.metadata),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

const metadataInclude = {
  metadata: { orderBy: { sortOrder: "asc" as const } },
};

async function nextPriorityForUser(userId: string) {
  const agg = await prisma.company.aggregate({
    where: { userId },
    _max: { priority: true },
  });
  return (agg._max.priority ?? 0) + 1;
}

async function replaceMetadata(
  tx: Prisma.TransactionClient,
  companyId: string,
  items: MetadataItem[],
) {
  await tx.companyMetadata.deleteMany({ where: { companyId } });
  if (items.length === 0) return;
  await tx.companyMetadata.createMany({
    data: items.map((item, index) => ({
      companyId,
      key: item.key,
      value: item.value,
      sortOrder: index,
    })),
  });
}

companiesRoutes.get("/", async (c) => {
  const user = await requireUser(c);
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const page = Math.max(1, Number(c.req.query("page") ?? "1") || 1);
  const q = (c.req.query("q") ?? "").trim();
  const skip = (page - 1) * PAGE_SIZE;

  const searchFilter: Prisma.CompanyWhereInput = q
    ? {
        OR: [{ name: { contains: q } }, { description: { contains: q } }],
      }
    : {};

  const where: Prisma.CompanyWhereInput = {
    userId: user.id,
    ...searchFilter,
  };

  const [total, rows, nextPriority] = await Promise.all([
    prisma.company.count({ where }),
    prisma.company.findMany({
      where,
      include: metadataInclude,
      orderBy: [{ priority: "asc" }, { name: "asc" }],
      skip,
      take: PAGE_SIZE,
    }),
    nextPriorityForUser(user.id),
  ]);

  const items = rows.map((row) => toDetail(row));
  return c.json({ items, total, page, pageSize: PAGE_SIZE, nextPriority });
});

companiesRoutes.get("/:id", async (c) => {
  const user = await requireUser(c);
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const id = c.req.param("id");
  const row = await prisma.company.findFirst({
    where: { id, userId: user.id },
    include: metadataInclude,
  });
  if (!row) {
    return c.json({ error: "Not found" }, 404);
  }

  return c.json(toDetail(row));
});

companiesRoutes.post("/", async (c) => {
  const user = await requireUser(c);
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const body = await c.req.json().catch(() => null);
  const parsed = writeSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Invalid company payload" }, 400);
  }

  const metadata = normalizeMetadata(parsed.data.metadata);
  if (!metadata.ok) {
    return c.json({ error: metadata.error }, 400);
  }

  const priority =
    parsed.data.priority ?? (await nextPriorityForUser(user.id));

  const row = await prisma.$transaction(async (tx) => {
    const created = await tx.company.create({
      data: {
        userId: user.id,
        name: parsed.data.name,
        description: parsed.data.description,
        priority,
      },
    });
    await replaceMetadata(tx, created.id, metadata.value);
    return tx.company.findUniqueOrThrow({
      where: { id: created.id },
      include: metadataInclude,
    });
  });

  return c.json(toDetail(row), 201);
});

companiesRoutes.put("/:id", async (c) => {
  const user = await requireUser(c);
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const id = c.req.param("id");
  const existing = await prisma.company.findFirst({
    where: { id, userId: user.id },
  });
  if (!existing) {
    return c.json({ error: "Not found" }, 404);
  }

  const body = await c.req.json().catch(() => null);
  const parsed = writeSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Invalid company payload" }, 400);
  }

  const metadata = normalizeMetadata(parsed.data.metadata);
  if (!metadata.ok) {
    return c.json({ error: metadata.error }, 400);
  }

  const row = await prisma.$transaction(async (tx) => {
    await tx.company.update({
      where: { id },
      data: {
        name: parsed.data.name,
        description: parsed.data.description,
        priority: parsed.data.priority ?? existing.priority,
      },
    });
    await replaceMetadata(tx, id, metadata.value);
    return tx.company.findUniqueOrThrow({
      where: { id },
      include: metadataInclude,
    });
  });

  return c.json(toDetail(row));
});

companiesRoutes.delete("/:id", async (c) => {
  const user = await requireUser(c);
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const id = c.req.param("id");
  const existing = await prisma.company.findFirst({
    where: { id, userId: user.id },
  });
  if (!existing) {
    return c.json({ error: "Not found" }, 404);
  }

  await prisma.company.delete({ where: { id } });
  return c.json({ ok: true });
});
