import JSZip from "jszip";
import { buildResumeDocxBuffer } from "@johel/resume/docx";
import { buildResumePdfBuffer } from "@johel/resume/pdf";
import {
  buildResumeExportBaseName,
  buildResumeProfileBundleFileName,
  type GeneratedResume,
  type ResumeExportNameInput,
} from "@johel/resume";

export async function buildResumeZipBuffer(
  resume: GeneratedResume,
  label: ResumeExportNameInput,
): Promise<{ buffer: Buffer; fileName: string }> {
  const folderName = buildResumeExportBaseName(label);
  const docxName = buildResumeProfileBundleFileName(resume.header.name, "docx");
  const pdfName = buildResumeProfileBundleFileName(resume.header.name, "pdf");

  const [docxBuffer, pdfBuffer] = await Promise.all([
    buildResumeDocxBuffer(resume),
    buildResumePdfBuffer(resume),
  ]);

  const zip = new JSZip();
  const folder = zip.folder(folderName);
  if (!folder) {
    throw new Error("ZIP folder could not be created.");
  }
  folder.file(docxName, docxBuffer);
  folder.file(pdfName, pdfBuffer);

  const buffer = await zip.generateAsync({ type: "nodebuffer" });
  return { buffer, fileName: `${folderName}.zip` };
}
