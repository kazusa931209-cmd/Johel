import { Hono } from "hono";
import { z } from "zod";
import { buildResumeDocxBuffer } from "@johel/resume/docx";
import { generatedResumeSchema, isNonEmptyResume } from "@johel/resume";
import { requireUser } from "../lib/session.js";

const DOCX_MEDIA_TYPE =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

const postSchema = z.object({
  resume: generatedResumeSchema,
});

function sanitizeFileName(name: string): string {
  const sanitized = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return sanitized || "resume";
}

export const resumeRoutes = new Hono();

resumeRoutes.post("/docx", async (c) => {
  const user = await requireUser(c);
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const body = await c.req.json().catch(() => null);
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Invalid resume data." }, 400);
  }

  const resume = parsed.data.resume;
  if (!isNonEmptyResume(resume)) {
    return c.json({ error: "Generated resume is empty." }, 400);
  }

  try {
    const buffer = await buildResumeDocxBuffer(resume);
    const fileName = `${sanitizeFileName(resume.header.name)}.docx`;
    return c.body(buffer, 200, {
      "Content-Type": DOCX_MEDIA_TYPE,
      "Content-Disposition": `attachment; filename="${fileName}"`,
    });
  } catch {
    return c.json({ error: "DOCX generation failed." }, 500);
  }
});
