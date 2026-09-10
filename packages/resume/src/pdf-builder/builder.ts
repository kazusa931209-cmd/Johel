import { PDFDocument, StandardFonts } from "pdf-lib";
import type { GeneratedResume } from "../domain/generated-resume";
import { renderDefaultResumePdf } from "./templates/default";
import {
  DEFAULT_RESUME_PDF_STYLE,
  type ResumePdfStyle,
} from "./styles";

export async function buildResumePdfBuffer(
  resume: GeneratedResume,
  style: ResumePdfStyle = DEFAULT_RESUME_PDF_STYLE,
): Promise<Buffer> {
  const doc = await PDFDocument.create();
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const italic = await doc.embedFont(StandardFonts.HelveticaOblique);

  renderDefaultResumePdf(doc, resume, { regular, bold, italic }, style);

  const bytes = await doc.save();
  return Buffer.from(bytes);
}

export async function buildResumePdfBlob(
  resume: GeneratedResume,
  style: ResumePdfStyle = DEFAULT_RESUME_PDF_STYLE,
): Promise<Blob> {
  const buffer = await buildResumePdfBuffer(resume, style);
  return new Blob([buffer], { type: "application/pdf" });
}
