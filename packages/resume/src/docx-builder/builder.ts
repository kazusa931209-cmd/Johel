import { Document, Packer } from "docx";
import type { GeneratedResume } from "../domain/generated-resume";
import { buildDefaultResumeDocxChildren } from "./templates/default";
import {
  DEFAULT_RESUME_DOCX_STYLE,
  type ResumeDocxStyle,
} from "./styles";

function createResumeDocument(
  resume: GeneratedResume,
  style: ResumeDocxStyle,
): Document {
  return new Document({
    sections: [
      {
        properties: {},
        children: buildDefaultResumeDocxChildren(resume, style),
      },
    ],
  });
}

export async function buildResumeDocxBuffer(
  resume: GeneratedResume,
  style: ResumeDocxStyle = DEFAULT_RESUME_DOCX_STYLE,
): Promise<Buffer> {
  const document = createResumeDocument(resume, style);
  return Packer.toBuffer(document);
}

export async function buildResumeDocxBlob(
  resume: GeneratedResume,
  style: ResumeDocxStyle = DEFAULT_RESUME_DOCX_STYLE,
): Promise<Blob> {
  const document = createResumeDocument(resume, style);
  return Packer.toBlob(document);
}
