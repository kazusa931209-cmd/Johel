import { Hono } from "hono";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { formatMarkdownOnSave } from "../lib/ai-markdown-format/format-on-save.js";
import { prisma } from "../lib/prisma.js";
import { requireUser } from "../lib/session.js";
import {
  listResponsePageSize,
  parseListPagination,
} from "../lib/list-pagination.js";

const PAGE_SIZE = 10;

const writeSchema = z.object({
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().min(1).max(20000),
});

type CompanyRow = {
  id: string;
  name: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
};

export const companiesRoutes = new Hono();

function toDetail(row: CompanyRow) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

companiesRoutes.get("/", async (c) => {
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

  const searchFilter: Prisma.CompanyWhereInput = q
    ? {
        OR: [{ name: { contains: q } }, { description: { contains: q } }],
      }
    : {};

  const where: Prisma.CompanyWhereInput = {
    userId: user.id,
    ...searchFilter,
  };

  const [total, rows] = await Promise.all([
    prisma.company.count({ where }),
    prisma.company.findMany({
      where,
      orderBy: { name: "asc" },
      ...(pagination.skip != null ? { skip: pagination.skip } : {}),
      ...(pagination.take != null ? { take: pagination.take } : {}),
    }),
  ]);

  const items = rows.map((row) => toDetail(row));
  const pageSize = listResponsePageSize(pagination, total);
  return c.json({ items, total, page: pagination.page, pageSize });
});

companiesRoutes.get("/:id", async (c) => {
  const user = await requireUser(c);
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const id = c.req.param("id");
  const row = await prisma.company.findFirst({
    where: { id, userId: user.id },
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

  try {
    const { formatted: description } = await formatMarkdownOnSave({
      userId: user.id,
      kind: "companyDescription",
      submitted: parsed.data.description,
      stored: "",
      maxLen: 20_000,
    });

    const row = await prisma.company.create({
      data: {
        userId: user.id,
        name: parsed.data.name,
        description,
      },
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

  try {
    const { formatted: description } = await formatMarkdownOnSave({
      userId: user.id,
      kind: "companyDescription",
      submitted: parsed.data.description,
      stored: existing.description,
      maxLen: 20_000,
    });

    const row = await prisma.company.update({
      where: { id },
      data: {
        name: parsed.data.name,
        description,
      },
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
