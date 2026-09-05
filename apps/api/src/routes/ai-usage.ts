import { Hono } from "hono";
import { prisma } from "../lib/prisma.js";
import { requireUser } from "../lib/session.js";
import { sumTokenUsed } from "../lib/sum-token-used.js";
import {
  listResponsePageSize,
  parseListPagination,
} from "../lib/list-pagination.js";

const PAGE_SIZE = 100;

type AiUsageListRow = {
  id: string;
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

export const aiUsageRoutes = new Hono();

function toListItem(row: AiUsageListRow) {
  return {
    id: row.id,
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

aiUsageRoutes.get("/summary", async (c) => {
  const user = await requireUser(c);
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const tokenUsed = await sumTokenUsed(user.id);
  return c.json({ tokenUsed });
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

  const where = { userId: user.id };

  const [total, rows] = await Promise.all([
    prisma.aiUsage.count({ where }),
    prisma.aiUsage.findMany({
      where,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        aiProvider: true,
        modelName: true,
        generateType: true,
        inputToken: true,
        outputToken: true,
        createdAt: true,
      },
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
  });

  if (!row) {
    return c.json({ error: "Not found" }, 404);
  }

  return c.json(toDetail(row));
});
