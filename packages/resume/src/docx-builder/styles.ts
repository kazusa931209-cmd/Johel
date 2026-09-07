export type ResumeDocxStyle = {
  fontFamily: string;
  fontSize: number;
  headingSize: number;
  sectionHeadingSize: number;
  sectionSpacing: number;
  paragraphSpacing: number;
  lineSpacing: number;
};

export const DEFAULT_RESUME_DOCX_STYLE: ResumeDocxStyle = {
  fontFamily: "Arial",
  fontSize: 22,
  headingSize: 32,
  sectionHeadingSize: 26,
  paragraphSpacing: 120,
  sectionSpacing: 240,
  lineSpacing: 276,
};
