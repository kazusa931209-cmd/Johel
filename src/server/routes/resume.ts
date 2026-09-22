import { Hono } from "hono";
import { z } from "zod";
import { buildResumeDocxBuffer } from "@johel/resume/docx";
import { buildResumePdfBuffer } from "@johel/resume/pdf";
import {
  buildResumeExportFileName,
  generatedResumeSchema,
  isNonEmptyResume,
  type ResumeExportFormat,
} from "@johel/resume";
import { buildCombineGenerationFingerprint } from "../lib/resume/generation-fingerprint";
import { buildResumeZipBuffer } from "../lib/resume-export-zip";
import { requireUser } from "../lib/session";

const DOCX_MEDIA_TYPE =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const PDF_MEDIA_TYPE = "application/pdf";
const ZIP_MEDIA_TYPE = "application/zip";

const combineCompanySchema = z.object({
  companyId: z.string().trim().min(1),
  startDate: z.string().trim().min(1),
  endDate: z.string().trim().min(1),
  roleContext: z.string().trim().min(1),
  keywordContext: z.string().max(500).optional(),
  experienceIds: z.array(z.string().trim().min(1)).default([]),
});

const combineSchema = z.object({
  profileId: z.string().trim().min(1),
  language: z.enum(["en", "ja", "zh-TW", "zh-CN", "ko"]),
  emphasis: z.string().max(2000),
  companies: z.array(combineCompanySchema).min(1),
});

const exportPostSchema = z.object({
  resume: generatedResumeSchema,
  publicId: z.string().trim().max(64).optional(),
  jdCompanyName: z.string().trim().max(200).optional(),
  jdJobRole: z.string().trim().max(200).optional(),
});

const fingerprintPostSchema = z.object({
  combine: combineSchema,
});

export const resumeRoutes = new Hono();

resumeRoutes.post("/combine-fingerprint", async (c) => {
  const user = await requireUser(c);
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const body = await c.req.json().catch(() => null);
  const parsed = fingerprintPostSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Invalid combine snapshot." }, 400);
  }

  try {
    const fingerprint = await buildCombineGenerationFingerprint(
      user.id,
      parsed.data.combine,
    );
    return c.json({ fingerprint });
  } catch (err) {
    const message =
      err instanceof Error && err.message
        ? err.message
        : "Combine fingerprint could not be built.";
    return c.json({ error: message }, 400);
  }
});

resumeRoutes.post("/docx", async (c) => {
  const user = await requireUser(c);
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const body = await c.req.json().catch(() => null);
  const parsed = exportPostSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Invalid resume data." }, 400);
  }

  const resume = parsed.data.resume;
  if (!isNonEmptyResume(resume)) {
    return c.json({ error: "Generated resume is empty." }, 400);
  }

  try {
    const buffer = await buildResumeDocxBuffer(resume);
    const fileName = buildResumeExportFileName(
      {
        publicId: parsed.data.publicId,
        jdCompanyName: parsed.data.jdCompanyName,
        jdJobRole: parsed.data.jdJobRole,
      },
      "docx",
    );
    return c.body(new Uint8Array(buffer), 200, {
      "Content-Type": DOCX_MEDIA_TYPE,
      "Content-Disposition": `attachment; filename="${fileName}"`,
    });
  } catch {
    return c.json({ error: "DOCX generation failed." }, 500);
  }
});

function buildExportFileName(
  parsed: z.infer<typeof exportPostSchema>,
  format: ResumeExportFormat,
): string {
  return buildResumeExportFileName(
    {
      publicId: parsed.publicId,
      jdCompanyName: parsed.jdCompanyName,
      jdJobRole: parsed.jdJobRole,
    },
    format,
  );
}

resumeRoutes.post("/pdf", async (c) => {
  const user = await requireUser(c);
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const body = await c.req.json().catch(() => null);
  const parsed = exportPostSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Invalid resume data." }, 400);
  }

  const resume = parsed.data.resume;
  if (!isNonEmptyResume(resume)) {
    return c.json({ error: "Generated resume is empty." }, 400);
  }

  try {
    const buffer = await buildResumePdfBuffer(resume);
    const fileName = buildExportFileName(parsed.data, "pdf");
    return c.body(new Uint8Array(buffer), 200, {
      "Content-Type": PDF_MEDIA_TYPE,
      "Content-Disposition": `attachment; filename="${fileName}"`,
    });
  } catch {
    return c.json({ error: "PDF generation failed." }, 500);
  }
});

resumeRoutes.post("/zip", async (c) => {
  const user = await requireUser(c);
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const body = await c.req.json().catch(() => null);
  const parsed = exportPostSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Invalid resume data." }, 400);
  }

  const resume = parsed.data.resume;
  if (!isNonEmptyResume(resume)) {
    return c.json({ error: "Generated resume is empty." }, 400);
  }

  try {
    const { buffer, fileName } = await buildResumeZipBuffer(resume, {
      publicId: parsed.data.publicId,
      jdCompanyName: parsed.data.jdCompanyName,
      jdJobRole: parsed.data.jdJobRole,
    });
    return c.body(new Uint8Array(buffer), 200, {
      "Content-Type": ZIP_MEDIA_TYPE,
      "Content-Disposition": `attachment; filename="${fileName}"`,
    });
  } catch {
    return c.json({ error: "ZIP generation failed." }, 500);
  }
});
