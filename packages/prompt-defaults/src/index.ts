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
- \`run.language\`: Output language of the resume.
- \`companies[]\` order: Resume experience order. Keep it.
- \`companies[].name\`: Employer name on the resume. Do not use \`alias\` in output.
- \`companies[].alias\`: Internal label only. Ignore for writing.
- \`companies[].whatCompanyIs\`: One-sentence scene (industry, product, customer). Do not paste as bullets.
- \`companies[].domainAndStack\`: Domain, product scope, tech. Bullet list with bold labels; use for wording and grounding; do not paste as bullets.
- \`companies[].roleContext\`: Nature of the role held there. Primary hint for \`title\`. Not achievements.
- \`companies[].keywordContext\`: Optional steering for this employer block in this run. Use with the JD rubric to choose emphasis and compress bullets. When filled, prioritize linked cards that match those keywords; compress or omit cards with no keyword and rubric overlap unless \`run.emphasis\` says otherwise. When empty or "(none — match from job context only)", use the JD rubric and role context only (Auto).
- \`companies[].startDate\` / \`endDate\`: Employment dates. Copy as-is. They mark tenure only; they do not mean every tool named under that company was used for the full period.
- \`companies[].experiences[]\`: Materials already assigned to that company. Do not move them. Do not drop a linked experience unless it has zero overlap with the rubric and \`run.emphasis\` says to omit.
- \`experiences[].category\`: Work cluster; use when choosing \`title\` and grouping skills.
- \`experiences[].problem\`: What was solved. Bullet list with bold labels; use as the situation in the bullet.
- \`experiences[].actions\`: What was done (verb + object) and tech/methods. Bullet list with bold labels; use as the action in the bullet.
- \`experiences[].outcome\`: Result for that same card. Bullet list with bold labels; include numbers only when this field has them.

## Experience Synthesis
For each company, emit one experience object.
- \`company\`: \`companies[].name\`
- \`title\`: Honest blend of \`roleContext\` + scene (\`whatCompanyIs\`, \`domainAndStack\`) + linked \`category\`s, angled toward Role.title. Do not copy the JD title onto every company.
- \`bullets\`: One linked experience card → its own bullet(s). Do not merge tech, metrics, or outcomes from different cards into one bullet.
  - When \`keywordContext\` is filled: prefer 1–2 bullets per linked card; keep the company block focused on keyword + rubric overlap.
  - When \`keywordContext\` is empty: 1–3 bullets per linked card.
  - Prefer this shape:
    - Lead with an action from that card's \`actions\`.
    - Ground the scene with company domain wording only (not a stack dump from \`domainAndStack\`).
    - Close with that card's \`outcome\` when present.
    - Keep the problem visible only when it clarifies impact.
- Card isolation: each bullet must trace to exactly one linked experience card. Never move a tool or metric from card A into a bullet derived from card B.
- Tech density: name at most 2–3 technologies per bullet, taken only from that card's \`actions\`. If the source lists more, paraphrase around the capability instead of inventorying frameworks, agents, or clouds.
- No stack laundry lists: do not enumerate multiple agent frameworks, LLM SDKs, or cloud platforms in one bullet (for example LangGraph, LangChain, CrewAI, AutoGen together). Use the 1–2 tools explicitly named on that card's action line.
- \`domainAndStack\` is scene tone only. Do not treat it as a tech source for bullets and do not paste it as bullets.
- Tenure wording: employment dates describe tenure only. Write capability-led bullets ("Built agentic workflows with LangGraph for …"). Do not write period-wide inventories ("Used X, Y, Z throughout tenure") and do not synthesize all linked cards into one concurrent operating stack for the full employment period.
- Multi-cloud / platform: at most one primary cloud or Kubernetes platform per bullet, from that card's \`actions\`. Across the whole company block, include at most two distinct cloud/platform families grounded in linked cards for that company. Do not combine EKS, GKE, Vertex AI, Azure, or similar into one bullet unless a single linked card explicitly describes that multi-cloud setup.
- Cross-company metrics: each quantified before→after outcome (same metric and baseline) may appear only once in the entire resume. When the same outcome appears in materials for multiple companies, keep the numbers on the most specific card in resume company order; elsewhere rephrase qualitatively without repeating the same numbers or baseline.
- Ground tools, products, and metrics only if they appear in that card's \`actions\` or \`outcome\`, or in \`whatCompanyIs\` for scene wording only.
- Prefer: company-domain wording (scene) + STAR facts (materials) + JD keywords (rubric).

## Summary
Write 3–5 sentences: target role from Role, then 2–3 proofs taken from the rewritten experiences that match Top Hiring Signals and Technical Requirements.
When stating total years of experience, derive it from the sum of each company's employment period (\`companies[].startDate\`–\`endDate\`). Express that total accurately; do not inflate it to match JD requirements.
Do not introduce skills that are not in the materials.

## Skills
Build 4–5 skill groups. Include 12–20 skill items in total across all groups for senior depth.
Source in this order:
1. Intersection of Technical Requirements / Critical JD Terminology with experience materials (\`actions\`, \`category\`).
2. Strong technologies from linked experience materials even when not in the JD (secondary groups).
3. Mentioned-only JD items only when they also appear in the materials.
Do not copy the full JD skill list. Do not fill Verdict missing-skill questions. Do not leave Skills sparse when the materials support more grounded items.

## Grounding
Copy employers, dates, education, and contact from input.
You may rewrite phrasing. You may not invent employers, dates, tools, metrics, or jobs.
Do not imply that tools named under a company were used for the entire employment period unless a single linked card's materials clearly support that scope.
Output language must follow \`run.language\`.`;

export const DEFAULT_EVALUATE_PROMPT = `## Rubric
Score the resume against the same dimensions as Verdict.
If Job context is Verdict Markdown, read these sections first: Role, Core Objective, Top Hiring Signals, Responsibilities, Technical Requirements, Domain / Industry, Experience & Qualifications, Critical JD Terminology, and Final Verdict.
If Job context is a filtered job description without those headings, derive the same dimensions from the text. Do not require the headings to be present.

Weight Required over Preferred. Do not treat Mentioned-only items as must-haves. Do not penalize the resume for missing Mentioned-only items.

## Scoring rules
- Overall score is 0–100.
- Reward evidence in Experience and Summary, not Skills lists alone.
- Count a Technical Requirement or Critical JD Terminology term as covered only when the resume shows it in Experience (or a clearly evidenced Skills item that also appears in Experience).
- Do not invent resume facts. If it is not in the resume, it is a gap.
- Do not suggest adding employers, dates, tools, or metrics that are not in the resume.
- Write in the same language as the resume.

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
Which Critical JD Terminology appear in the resume, and which Required terms are missing.

### Strengths
(bullet list, grounded in the resume)

### Gaps & risks
(bullet list; Required gaps first)

### Suggested improvements
(bullet list, actionable, resume-side only)`;

export const DEFAULT_PROMPTS = {
  verdictPrompt: DEFAULT_VERDICT_PROMPT,
  generatePrompt: DEFAULT_GENERATE_PROMPT,
  evaluatePrompt: DEFAULT_EVALUATE_PROMPT,
} as const;
