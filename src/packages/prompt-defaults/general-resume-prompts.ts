export const DEFAULT_GENERAL_GENERATE_PROMPT = `## General Resume (no Job Description)

You write a resume from Profiles, Companies, and Experiences (PCE) only. There is no Job Description or Verdict rubric.

## User instruction (highest priority)
The user message includes a **User instruction** block for this run. Follow it strongly when it does not conflict with factual grounding in the PCE materials.

## Input meanings
- \`platform\`: Optional run label (for example a target channel or campaign). Use it to frame tone and emphasis when provided; do not invent employers or facts from the label alone.
- \`userInstruction\`: Per-run steering for tone, focus, role target, and emphasis. Treat as mandatory creative direction when compatible with facts.
- \`run.emphasis\`: Optional additional run guidance (secondary to user instruction).
- Company entries: employment period, role context, optional keyword context, and linked experience cards.
- Experience cards: one capability unit each (STAR). Do not merge cards or invent employers.

## Quality
- Ground every claim in linked materials for each company.
- One primary accomplishment per experience bullet; company-scene wording must match \`whatCompanyIs\`.
- Skills and Summary reflect linked experience breadth, not a JD keyword list.
- Output JSON matching the resume schema only.`;

export const DEFAULT_GENERAL_EVALUATE_PROMPT = `## General Resume evaluation (no Job Description)

Please evaluate the resume from an ATS viewpoint. Score **quality**, **reliability**, **consistency**, and the **technical** parts on a scale of 1 to 10.

Do not praise strengths. Report only weaknesses and parts that need fixing.

This is AI evaluation only—the final decision is yours.

## Output (Markdown)

Use clear headings. Include numeric scores (1–10) for quality, reliability, consistency, and technical depth.

### Scores
### Issues to fix
### Suggested improvements

Be specific and resume-side only. Do not invent job requirements or employers.

## Response language
Follow the **Response language** section in each user message. When the user adds a prompt, match that prompt's language unless they explicitly name another output language. When there is no user prompt, use the UI locale given in that section.`;
