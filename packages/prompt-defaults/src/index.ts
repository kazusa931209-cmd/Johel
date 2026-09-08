export const DEFAULT_VERDICT_PROMPT = `## Fit questions
Answer each question about job fit. Use a ### heading per question, then the answer below.

### Is this position fully remote?
Yes or No, followed by a one-sentence reason, or Not found.

## JD analysis
Analyze the Job Description and produce a concise structured representation for resume generation.

Identify:
- What the employer most wants
- What the candidate is expected to do
- Which terminology the employer uses

Rules:
- Use only information explicitly stated in the JD.
- Do not invent, infer, assume, or supplement information.
- Do not use external knowledge or research.
- Do not evaluate the candidate or invent candidate experience.
- Do not write resume content.
- Preserve important JD terminology and wording.
- Rank candidate-selection signals primarily from explicit requirements, qualifications, and preferred experience.
- Distinguish Required / Preferred / Mentioned only where the JD clearly supports that distinction.
- Do not turn responsibilities, products, technologies, or domain descriptions into candidate requirements unless the JD presents them as requirements.
- Use Mentioned for relevant information that is in the JD but is not clearly Required or Preferred.
- Rank hiring signals from the JD's wording, repetition, emphasis, and structure.
- Avoid duplicating the same information across sections.
- Treat duplicated or translated versions of the same JD content as the same information.
- Use Not specified when information is absent.

## Role
- Title:
- Function:
- Seniority:
- Employment Type:
- Work Arrangement:
- Location:

## Core Objective
What the role is primarily responsible for, based only on the JD.

## Top Hiring Signals
Rank the strongest candidate-selection signals from highest to lowest (up to 5).

## Responsibilities
Bullet list.

## Technical Requirements
### Required
### Preferred
### Mentioned

## Domain / Industry
### Core Domain
### Preferred Industry Experience
### Mentioned

## Experience & Qualifications
### Required
### Preferred
### Mentioned

## Critical JD Terminology
Extract the employer's most important original terms and phrases.

## Final Verdict
Summarize in 3-5 bullets:
- What this job is fundamentally looking for
- The strongest technical requirements
- The strongest domain and experience signals
- The most important JD terminology
- Any important distinction between required and preferred requirements

Represent the JD, not the candidate. Every output item must be traceable to the original JD.

## Company & Contacts
Extract when present: company name, description, website, industry, products/services, mission/vision, contact details.
Use Not found for missing items.`;

export const DEFAULT_GENERATE_PROMPT = `## Targeting
The user message is labeled Markdown (Job context, Run intent, Profile, Companies). Field names below map to those labels.
Use \`jobContext\` as the only scoring rubric.
When it is Verdict Markdown, read these sections first: Role, Core Objective, Top Hiring Signals, Responsibilities, Technical Requirements, Domain / Industry, Experience & Qualifications, Critical JD Terminology, and Final Verdict.
Map Role.title to the target job title. Treat Technical Requirements as skills. Treat Critical JD Terminology as exact keywords to reuse when the materials support them.
When jobContext is a filtered job description (no Verdict), use the same rubric from the raw text.
Every summary sentence and experience bullet should map to at least one item from that rubric.
Do not treat company or experience fields as the job target.

## Input Meanings
- \`run.emphasis\`: Persona and emphasis for this run.
- \`run.language\`: Output language of the résumé.
- \`companies[]\` order: Résumé experience order. Keep it.
- \`companies[].name\`: Employer name on the résumé. Do not use \`alias\` in output.
- \`companies[].alias\`: Internal label only. Ignore for writing.
- \`companies[].whatCompanyIs\`: One-sentence scene (industry, product, customer). Do not paste as bullets.
- \`companies[].domainAndStack\`: Domain, product scope, tech. Bullet list with bold labels; use for wording and grounding; do not paste as bullets.
- \`companies[].roleContext\`: Nature of the role held there. Primary hint for \`title\`. Not achievements.
- \`companies[].startDate\` / \`endDate\`: Employment dates. Copy as-is.
- \`companies[].experiences[]\`: Materials already assigned to that company. Do not move them. Do not drop a linked experience unless it has zero overlap with the rubric and \`run.emphasis\` says to omit.
- \`experiences[].category\`: Work cluster; use when choosing \`title\` and grouping skills.
- \`experiences[].problem\`: What was solved. Bullet list with bold labels; use as the situation in the bullet.
- \`experiences[].actions\`: What was done (verb + object) and tech/methods. Bullet list with bold labels; use as the action in the bullet.
- \`experiences[].outcome\`: Result for that same card. Bullet list with bold labels; include numbers only when this field has them.

## Experience Synthesis
For each company, emit one experience object.
- \`company\`: \`companies[].name\`
- \`title\`: Honest blend of \`roleContext\` + scene (\`whatCompanyIs\`, \`domainAndStack\`) + linked \`category\`s, angled toward Role.title. Do not copy the JD title onto every company.
- \`bullets\`: One linked experience → 1–3 bullets. Prefer this shape:
  - Lead with an action from \`actions\`.
  - Ground the scene with company domain/stack wording.
  - Close with \`outcome\` when present.
  - Keep the problem visible only when it clarifies impact.
- Ground tools, products, and metrics only if they appear in \`actions\`, \`outcome\`, \`whatCompanyIs\`, or \`domainAndStack\`.
- Prefer: company-domain wording (scene) + STAR facts (materials) + JD keywords (rubric).

## Summary
Write 3–5 sentences: target role from Role, then 2–3 proofs taken from the rewritten experiences that match Top Hiring Signals and Technical Requirements.
Do not introduce skills that are not in the materials.

## Skills
Build 3–5 skill groups from the intersection of Technical Requirements / Critical JD Terminology and the experience materials (\`actions\`, \`domainAndStack\`, \`category\`).
At most 12 skill items in total across all groups.
Do not copy the JD skill list. Do not fill Verdict missing-skill questions. Do not use Mentioned-only items unless they also appear in the materials.

## Grounding
Copy employers, dates, education, and contact from input.
You may rewrite phrasing. You may not invent employers, dates, tools, metrics, or jobs.
Output language must follow \`run.language\`.`;

export const DEFAULT_EVALUATE_PROMPT = `## Rubric
Score the résumé against the same dimensions as Verdict.
If Job context is Verdict Markdown, read these sections first: Role, Core Objective, Top Hiring Signals, Responsibilities, Technical Requirements, Domain / Industry, Experience & Qualifications, Critical JD Terminology, and Final Verdict.
If Job context is a filtered job description without those headings, derive the same dimensions from the text. Do not require the headings to be present.

Weight Required over Preferred. Do not treat Mentioned-only items as must-haves. Do not penalize the résumé for missing Mentioned-only items.

## Scoring rules
- Overall score is 0–100.
- Reward evidence in Experience and Summary, not Skills lists alone.
- Count a Technical Requirement or Critical JD Terminology term as covered only when the résumé shows it in Experience (or a clearly evidenced Skills item that also appears in Experience).
- Do not invent résumé facts. If it is not in the résumé, it is a gap.
- Do not suggest adding employers, dates, tools, or metrics that are not in the résumé.
- Write in the same language as the résumé.

## Output structure
### Overall fit
(score 0–100 + 2–3 sentences)

### Role
Match of title and summary to Role (title, function, seniority).

### Technical Requirements
Required vs Preferred vs what Experience actually shows.

### Domain / Industry
### Experience & Qualifications
### Terminology (ATS)
Which Critical JD Terminology appear in the résumé, and which Required terms are missing.

### Strengths
(bullet list, grounded in the résumé)

### Gaps & risks
(bullet list; Required gaps first)

### Suggested improvements
(bullet list, actionable, résumé-side only)`;

export const DEFAULT_PROMPTS = {
  verdictPrompt: DEFAULT_VERDICT_PROMPT,
  generatePrompt: DEFAULT_GENERATE_PROMPT,
  evaluatePrompt: DEFAULT_EVALUATE_PROMPT,
} as const;
