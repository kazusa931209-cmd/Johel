export type ResumePdfStyle = {
  fontSize: number;
  headingSize: number;
  sectionHeadingSize: number;
  marginLeft: number;
  marginRight: number;
  marginTop: number;
  marginBottom: number;
  sectionSpacing: number;
  paragraphSpacing: number;
  lineHeight: number;
  bulletIndent: number;
};

export const DEFAULT_RESUME_PDF_STYLE: ResumePdfStyle = {
  fontSize: 11,
  headingSize: 16,
  sectionHeadingSize: 13,
  marginLeft: 54,
  marginRight: 54,
  marginTop: 54,
  marginBottom: 54,
  sectionSpacing: 12,
  paragraphSpacing: 6,
  lineHeight: 14,
  bulletIndent: 12,
};

/** A4 size in PDF points (matches pdf-lib default page dimensions). */
export const PDF_PAGE_WIDTH = 595.28;
export const PDF_PAGE_HEIGHT = 841.89;
