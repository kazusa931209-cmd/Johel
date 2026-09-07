export const DEFAULT_VERDICT_PROMPT = `## Verdict
Answer each question about job fit. Use a ### heading per question, then the answer below.

### Is this position fully remote?
(Yes/No with bold text + one sentence reason or "Not found")

### What required skills might be missing?
(bullet list, or "Not found")

## Job
Extract when present: title, salary, location, employment type, work arrangement, skills, responsibilities, requirements, qualifications, benefits.
Use "Not found" for missing items.

## Company & contacts
Extract when present: company name, description, website, industry, products/services, mission/vision, contact details.
Use "Not found" for missing items.`;

export const DEFAULT_GENERATE_PROMPT = `## Resume tailoring
Tailor the resume to the supplied Job Description and workflow profile data.

## Selection & rewriting
- Map linked experiences under their company; do not redistribute experiences across companies.
- Use each company entry's startDate and endDate as the employment date range.
- Prioritize and rewrite existing experience to match the target role.
- Omit information that does not support the target role.

## Language & tone
- Use strong, concise, professional resume language.
- Keep the resume ATS-friendly.
- Output language must follow the workflow language code in the input.`;

export const DEFAULT_EVALUATE_PROMPT = `## Evaluation criteria
Score the resume against the job description from an ATS perspective.

## Output structure
Use headings and lists that make scores and feedback easy to scan.

### Overall fit
(score 0–100 + brief summary)

### Strengths
(bullet list)

### Gaps & risks
(bullet list)

### Suggested improvements
(bullet list, actionable)`;

export const DEFAULT_PROMPTS = {
  verdictPrompt: DEFAULT_VERDICT_PROMPT,
  generatePrompt: DEFAULT_GENERATE_PROMPT,
  evaluatePrompt: DEFAULT_EVALUATE_PROMPT,
} as const;
