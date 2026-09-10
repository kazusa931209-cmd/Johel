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

export const PDF_PAGE_WIDTH = 612;
export const PDF_PAGE_HEIGHT = 792;
