import { Hono } from "hono";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireUser } from "../lib/session.js";
import {
  listResponsePageSize,
  parseListPagination,
} from "../lib/list-pagination.js";

const PAGE_SIZE = 10;
const CURRENT_YEAR = new Date().getFullYear();

const dateOnly = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid birth date")
  .optional()
  .nullable();

const linkItemSchema = z.object({
  key: z.string().trim().min(1).max(200),
  link: z.string().trim().max(2000).optional().nullable(),
});

const writeSchema = z.object({
  firstName: z.string().trim().min(1).max(200),
  lastName: z.string().trim().min(1).max(200),
  birthDate: dateOnly,
  email: z
    .union([z.string().trim().email().max(320), z.literal(""), z.null()])
    .optional(),
  pn: z.string().trim().max(100).optional().nullable(),
  residence: z.string().trim().max(500).optional().nullable(),
  university: z.string().trim().max(500).optional().nullable(),
  graduationYear: z
    .number()
    .int()
    .min(1950, "Graduation year is required")
    .max(CURRENT_YEAR, "Graduation year cannot be in the future"),
  degree: z.string().trim().max(500).optional().nullable(),
  links: z.array(linkItemSchema).max(100),
});

type LinkItem = {
  key: string;
  link: string | null;
};

type ProfileWithLinks = {
  id: string;
  firstName: string;
  lastName: string;
  birthDate: string | null;
  email: string | null;
  pn: string | null;
  residence: string | null;
  university: string | null;
  graduationYear: number | null;
  degree: string | null;
  createdAt: Date;
  updatedAt: Date;
  links: {
    key: string;
    link: string | null;
    sortOrder: number;
  }[];
};

export const profilesRoutes = new Hono();

function emptyToNull(value: string | null | undefined): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeLinks(
  items: z.infer<typeof writeSchema>["links"],
): { ok: true; value: LinkItem[] } | { ok: false; error: string } {
  const normalized: LinkItem[] = [];
  const seen = new Set<string>();
  for (const item of items) {
    const key = item.key.trim();
    const keyLower = key.toLowerCase();
    if (seen.has(keyLower)) {
      return { ok: false, error: "Link keys must be unique" };
    }
    seen.add(keyLower);
    normalized.push({
      key,
      link: item.link?.trim() ? item.link.trim() : null,
    });
  }
  return { ok: true, value: normalized };
}

function mapLinks(
  links: ProfileWithLinks["links"],
): LinkItem[] {
  return [...links]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((item) => ({
      key: item.key,
      link: item.link,
    }));
}

function toDetail(row: ProfileWithLinks) {
  return {
    id: row.id,
    firstName: row.firstName,
    lastName: row.lastName,
    birthDate: row.birthDate,
    email: row.email,
    pn: row.pn,
    residence: row.residence,
    university: row.university,
    graduationYear: row.graduationYear,
    degree: row.degree,
    links: mapLinks(row.links),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

const linksInclude = {
  links: { orderBy: { sortOrder: "asc" as const } },
};

async function replaceLinks(
  tx: Prisma.TransactionClient,
  profileId: string,
  items: LinkItem[],
) {
  await tx.profileLink.deleteMany({ where: { profileId } });
  if (items.length === 0) return;
  await tx.profileLink.createMany({
    data: items.map((item, index) => ({
      profileId,
      key: item.key,
      link: item.link,
      sortOrder: index,
    })),
  });
}

profilesRoutes.get("/", async (c) => {
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

  const searchFilter: Prisma.ProfileWhereInput = q
    ? {
        OR: [
          { firstName: { contains: q } },
          { lastName: { contains: q } },
          { email: { contains: q } },
          { pn: { contains: q } },
          { residence: { contains: q } },
          { university: { contains: q } },
          { degree: { contains: q } },
        ],
      }
    : {};

  const where: Prisma.ProfileWhereInput = {
    userId: user.id,
    ...searchFilter,
  };

  const [total, rows] = await prisma.$transaction([
    prisma.profile.count({ where }),
    prisma.profile.findMany({
      where,
      include: linksInclude,
      orderBy: { updatedAt: "desc" },
      ...(pagination.skip != null ? { skip: pagination.skip } : {}),
      ...(pagination.take != null ? { take: pagination.take } : {}),
    }),
  ]);

  const items = rows.map((row) => toDetail(row));
  const pageSize = listResponsePageSize(pagination, total);
  return c.json({ items, total, page: pagination.page, pageSize });
});

profilesRoutes.get("/:id", async (c) => {
  const user = await requireUser(c);
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const id = c.req.param("id");
  const row = await prisma.profile.findFirst({
    where: { id, userId: user.id },
    include: linksInclude,
  });
  if (!row) {
    return c.json({ error: "Not found" }, 404);
  }

  return c.json(toDetail(row));
});

profilesRoutes.post("/", async (c) => {
  const user = await requireUser(c);
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const body = await c.req.json().catch(() => null);
  const parsed = writeSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Invalid profile payload" }, 400);
  }

  const links = normalizeLinks(parsed.data.links);
  if (!links.ok) {
    return c.json({ error: links.error }, 400);
  }

  const row = await prisma.$transaction(async (tx) => {
    const created = await tx.profile.create({
      data: {
        userId: user.id,
        firstName: parsed.data.firstName,
        lastName: parsed.data.lastName,
        birthDate: emptyToNull(parsed.data.birthDate),
        email: emptyToNull(parsed.data.email),
        pn: emptyToNull(parsed.data.pn),
        residence: emptyToNull(parsed.data.residence),
        university: emptyToNull(parsed.data.university),
        graduationYear: parsed.data.graduationYear,
        degree: emptyToNull(parsed.data.degree),
      },
    });
    await replaceLinks(tx, created.id, links.value);
    return tx.profile.findUniqueOrThrow({
      where: { id: created.id },
      include: linksInclude,
    });
  });

  return c.json(toDetail(row), 201);
});

profilesRoutes.put("/:id", async (c) => {
  const user = await requireUser(c);
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const id = c.req.param("id");
  const existing = await prisma.profile.findFirst({
    where: { id, userId: user.id },
  });
  if (!existing) {
    return c.json({ error: "Not found" }, 404);
  }

  const body = await c.req.json().catch(() => null);
  const parsed = writeSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Invalid profile payload" }, 400);
  }

  const links = normalizeLinks(parsed.data.links);
  if (!links.ok) {
    return c.json({ error: links.error }, 400);
  }

  const row = await prisma.$transaction(async (tx) => {
    await tx.profile.update({
      where: { id },
      data: {
        firstName: parsed.data.firstName,
        lastName: parsed.data.lastName,
        birthDate: emptyToNull(parsed.data.birthDate),
        email: emptyToNull(parsed.data.email),
        pn: emptyToNull(parsed.data.pn),
        residence: emptyToNull(parsed.data.residence),
        university: emptyToNull(parsed.data.university),
        graduationYear: parsed.data.graduationYear,
        degree: emptyToNull(parsed.data.degree),
      },
    });
    await replaceLinks(tx, id, links.value);
    return tx.profile.findUniqueOrThrow({
      where: { id },
      include: linksInclude,
    });
  });

  return c.json(toDetail(row));
});

profilesRoutes.delete("/:id", async (c) => {
  const user = await requireUser(c);
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const id = c.req.param("id");
  const existing = await prisma.profile.findFirst({
    where: { id, userId: user.id },
  });
  if (!existing) {
    return c.json({ error: "Not found" }, 404);
  }

  await prisma.profile.delete({ where: { id } });
  return c.json({ ok: true });
});
