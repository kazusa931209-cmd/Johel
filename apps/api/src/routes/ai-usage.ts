import { Hono } from "hono";
import { prisma } from "../lib/prisma.js";
import { requireUser } from "../lib/session.js";
import { sumTodayTokenUsed, sumTokenUsed } from "../lib/sum-token-used.js";
import {
  listResponsePageSize,
  parseListPagination,
} from "../lib/list-pagination.js";

const PAGE_SIZE = 100;
const GROUP_PAGE_SIZE = 50;

type AiUsageListRow = {
  id: string;
  generationId: string | null;
  generation: { publicId: string } | null;
  aiProvider: string;
  modelName: string;
  generateType: string;
  inputToken: number;
  outputToken: number;
  createdAt: Date;
};

type AiUsageDetailRow = AiUsageListRow & {
  input: string;
  output: string;
};

type AiUsageGroupRow = {
  generationId: string;
  generationPublicId: string | null;
  callCount: number | bigint;
  inputToken: number | bigint;
  outputToken: number | bigint;
  latestCreatedAt: Date | string | number | bigint;
};

export const aiUsageRoutes = new Hono();

function toNumber(value: number | bigint | null | undefined) {
  if (value == null) return 0;
  return typeof value === "bigint" ? Number(value) : value;
}

function latestCreatedAtToMs(value: unknown): number {
  if (value instanceof Date) {
    return value.getTime();
  }
  if (typeof value === "bigint") {
    return Number(value);
  }
  if (typeof value === "number") {
    return value;
  }
  if (typeof value === "string") {
    if (/^\d+$/.test(value)) {
      return Number(value);
    }
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

function toIsoDate(value: unknown) {
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (typeof value === "bigint") {
    return new Date(Number(value)).toISOString();
  }
  if (typeof value === "number") {
    return new Date(value).toISOString();
  }
  if (typeof value === "string") {
    if (/^\d+$/.test(value)) {
      return new Date(Number(value)).toISOString();
    }
    return new Date(value).toISOString();
  }
  return new Date(String(value)).toISOString();
}

function sortGroupRowsByLatestCreatedAt(rows: AiUsageGroupRow[]) {
  return [...rows].sort(
    (a, b) =>
      latestCreatedAtToMs(b.latestCreatedAt) -
      latestCreatedAtToMs(a.latestCreatedAt),
  );
}

function toListItem(row: AiUsageListRow) {
  return {
    id: row.id,
    generationId: row.generationId,
    generationPublicId: row.generation?.publicId ?? null,
    aiProvider: row.aiProvider,
    modelName: row.modelName,
    generateType: row.generateType,
    inputToken: row.inputToken,
    outputToken: row.outputToken,
    createdAt: row.createdAt.toISOString(),
  };
}

function toDetail(row: AiUsageDetailRow) {
  return {
    ...toListItem(row),
    input: row.input,
    output: row.output,
  };
}

function parseGenerationIdFilter(value: string | undefined) {
  if (value === "none") {
    return null;
  }
  if (value?.trim()) {
    return value.trim();
  }
  return undefined;
}

const listSelect = {
  id: true,
  generationId: true,
  generation: { select: { publicId: true } },
  aiProvider: true,
  modelName: true,
  generateType: true,
  inputToken: true,
  outputToken: true,
  createdAt: true,
} as const;

function toGroupItem(row: AiUsageGroupRow) {
  const inputToken = toNumber(row.inputToken);
  const outputToken = toNumber(row.outputToken);
  return {
    generationId: row.generationId,
    generationPublicId: row.generationPublicId,
    callCount: toNumber(row.callCount),
    inputToken,
    outputToken,
    tokenUsed: inputToken + outputToken,
    latestCreatedAt: toIsoDate(row.latestCreatedAt),
  };
}

aiUsageRoutes.get("/summary", async (c) => {
  const user = await requireUser(c);
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const generationId = c.req.query("generationId")?.trim();
  if (generationId) {
    const generation = await prisma.generation.findFirst({
      where: { id: generationId, userId: user.id },
      select: { inputToken: true, outputToken: true },
    });
    return c.json({
      tokenUsed: generation
        ? generation.inputToken + generation.outputToken
        : 0,
    });
  }

  const [tokenUsed, todayTokenUsed] = await Promise.all([
    sumTokenUsed(user.id),
    sumTodayTokenUsed(user.id),
  ]);
  return c.json({ tokenUsed, todayTokenUsed });
});

aiUsageRoutes.get("/groups", async (c) => {
  const user = await requireUser(c);
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const pagination = parseListPagination(
    c.req.query("page"),
    c.req.query("limit"),
    GROUP_PAGE_SIZE,
  );

  const skip = pagination.skip ?? 0;
  const take = pagination.take ?? GROUP_PAGE_SIZE;

  const [countRows, groupRows] = await Promise.all([
    prisma.$queryRaw<Array<{ count: number | bigint }>>`
      SELECT CAST(COUNT(*) AS INTEGER) AS count
      FROM (
        SELECT a.generationId
        FROM aiUsage a
        WHERE a.userId = ${user.id} AND a.generationId IS NOT NULL
        GROUP BY a.generationId
      )
    `,
    prisma.$queryRaw<AiUsageGroupRow[]>`
      SELECT
        a.generationId AS generationId,
        g.publicId AS generationPublicId,
        CAST(COUNT(*) AS INTEGER) AS callCount,
        CAST(SUM(a.inputToken) AS INTEGER) AS inputToken,
        CAST(SUM(a.outputToken) AS INTEGER) AS outputToken,
        MAX(a.createdAt) AS latestCreatedAt
      FROM aiUsage a
      LEFT JOIN generations g ON g.id = a.generationId AND g.userId = a.userId
      WHERE a.userId = ${user.id} AND a.generationId IS NOT NULL
      GROUP BY a.generationId
      ORDER BY CAST(MAX(a.createdAt) AS INTEGER) DESC
      LIMIT ${take} OFFSET ${skip}
    `,
  ]);

  const total = Number(countRows[0]?.count ?? 0);
  const pageSize = listResponsePageSize(pagination, total);

  return c.json({
    items: sortGroupRowsByLatestCreatedAt(groupRows).map(toGroupItem),
    total,
    page: pagination.page,
    pageSize,
  });
});

aiUsageRoutes.get("/", async (c) => {
  const user = await requireUser(c);
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const pagination = parseListPagination(
    c.req.query("page"),
    c.req.query("limit"),
    PAGE_SIZE,
  );

  const generationIdFilter = parseGenerationIdFilter(c.req.query("generationId"));

  const where = {
    userId: user.id,
    ...(generationIdFilter === null
      ? { generationId: null }
      : generationIdFilter
        ? { generationId: generationIdFilter }
        : {}),
  };

  const [total, rows] = await Promise.all([
    prisma.aiUsage.count({ where }),
    prisma.aiUsage.findMany({
      where,
      orderBy: { createdAt: "desc" },
      select: listSelect,
      ...(pagination.skip != null ? { skip: pagination.skip } : {}),
      ...(pagination.take != null ? { take: pagination.take } : {}),
    }),
  ]);

  const items = rows.map((row) => toListItem(row));
  const pageSize = listResponsePageSize(pagination, total);
  return c.json({ items, total, page: pagination.page, pageSize });
});

aiUsageRoutes.get("/:id", async (c) => {
  const user = await requireUser(c);
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const id = c.req.param("id");
  const row = await prisma.aiUsage.findFirst({
    where: { id, userId: user.id },
    select: {
      ...listSelect,
      input: true,
      output: true,
    },
  });

  if (!row) {
    return c.json({ error: "Not found" }, 404);
  }

  return c.json(toDetail(row));
});
