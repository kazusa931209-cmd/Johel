const SYSTEM_PROMPT = `You extract structured job metadata from a Job Description.

Return a JSON object with exactly these keys:
- "jdCompanyName": the employer or hiring company name stated in the JD
- "jdJobRole": the job title or role stated in the JD

Rules:
- Use only information explicitly stated in the JD.
- Do not invent, infer, or supplement information.
- Use an empty string when a value is missing or unclear.
- Do not wrap the answer in a code fence.`;

export function getAiJdMetaSystemPrompt(): string {
  return SYSTEM_PROMPT;
}

export function buildAiJdMetaUserPrompt(jobDescription: string): string {
  return `Extract the employer company name and job title/role from this Job Description.

----------------------------------------
${jobDescription}
----------------------------------------

Respond with a JSON object only.`;
}
