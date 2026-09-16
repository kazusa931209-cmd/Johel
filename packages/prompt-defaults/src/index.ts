export const DEFAULT_VERDICT_PROMPT = `## Fit questions
Answer each question about job fit. Use a ### heading per question, then the answer below.

### Is this position fully remote?
Yes or No, followed by a one-sentence reason, or Not found.

### What is the company size or stage?
One sentence only. Use explicit JD wording when present (for example startup, scale-up, mid-market, enterprise, global). If the JD does not state size or stage, answer: Not found.

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
- Company name:
- Description:
- Website:
- Industry:
- Products/services:
- Mission/vision:
- Contact details:

Use Not found for missing items.`;

export const DEFAULT_GENERATE_PROMPT = `## Targeting
The user message is labeled Markdown (Job context, Run intent, Profile, Companies). Field names below map to those labels.
Use \`jobContext\` as the only scoring rubric.
When it is Verdict Markdown, read these sections first: Fit questions, Role, Core Objective, Top Hiring Signals, Responsibilities, Technical Requirements, Domain / Industry, Experience & Qualifications, Critical JD Terminology, and Final Verdict.
When Fit questions include company size or stage and it is not Not found, use it to angle Summary and Experience toward the employer context (for example startup agility vs enterprise scale) when the materials support it.
Map Role.title to the target job title. Treat Technical Requirements as skills. Treat Critical JD Terminology as exact keywords to reuse when the materials support them.
When jobContext is a filtered job description (no Verdict), use the same rubric from the raw text.
Summary and Skills use the full JD rubric. Experience bullets only are tiered by company selection order (see Experience Synthesis). Do not treat company or experience fields as the job target.

## Input Meanings
- \`run.emphasis\`: Persona and emphasis for this run.
- \`run.language\`: Output language of the resume.
- \`companies[]\` order: Resume experience order. Keep it.
- \`companies[].name\`: Employer name on the resume. Do not use \`alias\` in output.
- \`companies[].alias\`: Internal label only. Ignore for writing.
- \`companies[].whatCompanyIs\`: Company scene (industry, product, customer). Grounds every bullet at that employer. Do not paste as bullets.
- \`companies[].roleContext\`: Nature of the role held there. Primary hint for \`title\`. Caps JD tailoring — never write bullets that exceed what role context allows. Strongest constraint per company.
- \`companies[].keywordContext\`: Optional steering for this employer block in this run. When filled, keyword context has priority within that company's JD/keyword budget; keyword steering intensity scales with the company's JD tailoring weight. When empty or "(none — match from job context only)", use the JD rubric and role context only (Auto).
- \`companies[].jdTailoringWeight\`: Experience-bullet JD tailoring for this company (by selection order; tier chain depends on configured JD tier decay). Summary and Skills ignore this and stay full JD.
- \`generationPolicy.experienceDimensionMode\`: When the same capability appears at multiple companies, emphasize different dimensions per this mode.
- \`companies[].startDate\` / \`endDate\`: Employment dates. Copy as-is. They mark tenure only; they do not mean every tool named under that company was used for the full period.
- \`companies[].experiences[]\`: Materials already assigned to that company. Do not move them. Do not drop a linked experience unless it has zero overlap with the rubric and \`run.emphasis\` says to omit.
- \`experiences[].category\`: Work cluster; use when choosing \`title\` and grouping skills.
- \`experiences[].problem\`: What was solved. Bullet list with bold labels; use as the situation in the bullet.
- \`experiences[].actions\`: What was done (verb + object) and tech/methods. Bullet list with bold labels; use as the action in the bullet.
- \`experiences[].outcome\`: Result for that same card. Bullet list with bold labels; include numbers only when this field has them.

## Experience Synthesis
For each company, emit one experience object.
- Priority stack (per company Experience block): (1) \`whatCompanyIs\` grounds every bullet in that employer's scene; (2) \`roleContext\` caps JD tailoring; (3) \`jdTailoringWeight\` (tier by selection order — see each company's JD tailoring weight line); (4) \`keywordContext\` steers within the slot and scales with \`jdTailoringWeight\`.
- Cross-company dimension: when the same capability (\`category\`) appears at multiple companies, emphasize a different dimension per \`generationPolicy.experienceDimensionMode\`; do not repeat the same framing.
- \`company\`: \`companies[].name\`
- \`title\`: Honest blend of \`roleContext\` + scene (\`whatCompanyIs\`) + linked \`category\`s, angled toward Role.title within the role-context cap. Do not copy the JD title onto every company.
- \`bullets\`: One linked experience card → its own bullet(s). Do not merge tech, metrics, or outcomes from different cards into one bullet.
  - When \`keywordContext\` is filled: prefer 1–2 bullets per linked card; keep the company block focused on keyword + rubric overlap.
  - When \`keywordContext\` is empty: 1–3 bullets per linked card.
  - Prefer this shape:
    - Lead with an action from that card's \`actions\`.
    - Ground the scene with company domain wording from \`whatCompanyIs\`. The bullet must read as work at that employer — do not surface niche domain terms from the card that contradict the company scene.
    - Close with that card's \`outcome\` when present.
    - Keep the problem visible only when it clarifies impact.
- Card isolation: each bullet must trace to exactly one linked experience card. Never move a tool or metric from card A into a bullet derived from card B.
- Tech density: name at most 2–3 technologies per bullet, taken only from that card's \`actions\`. If the source lists more, paraphrase around the capability instead of inventorying frameworks, agents, or clouds.
- No stack laundry lists: do not enumerate multiple agent frameworks, LLM SDKs, or cloud platforms in one bullet (for example LangGraph, LangChain, CrewAI, AutoGen together). Use the 1–2 tools explicitly named on that card's action line.
- Tenure wording: employment dates describe tenure only. Write capability-led bullets ("Built agentic workflows with LangGraph for …"). Do not write period-wide inventories ("Used X, Y, Z throughout tenure") and do not synthesize all linked cards into one concurrent operating stack for the full employment period.
- Multi-cloud / platform: at most one primary cloud or Kubernetes platform per bullet, from that card's \`actions\`. Across the whole company block, include at most two distinct cloud/platform families grounded in linked cards for that company. Do not combine EKS, GKE, Vertex AI, Azure, or similar into one bullet unless a single linked card explicitly describes that multi-cloud setup.
- Cross-company metrics: each quantified before→after outcome (same metric and baseline) may appear only once in the entire resume. When the same outcome appears in materials for multiple companies, keep the numbers on the most specific card in resume company order; elsewhere rephrase qualitatively without repeating the same numbers or baseline.
- Ground tools, products, and metrics only if they appear in that card's \`actions\` or \`outcome\`, or in \`whatCompanyIs\` for scene wording only.
- Prefer: company-domain wording (scene) + STAR facts (materials) + JD keywords (rubric).
- Company scene grounding example:
  - Employer scene: retail SaaS platform / retail operations.
  - Avoid: "Built an ingestion pipeline for inconsistent Illumina CSV imports, normalizing probe names, resolving duplicate mappings and rsIDs, and validating allele encodings …"
  - Prefer: "Built an ingestion pipeline for inconsistent retail-operations CSV imports, normalizing identifiers, resolving duplicate mappings, and validating encodings to produce stable, validated operational data."
- One accomplishment per bullet: do not chain pipeline stages or JD rubric items in one bullet (for example extraction → validation → transformation → loading). Use at most 1–2 JD-relevant terms per bullet when they fit naturally; paraphrase the rest as capabilities.
- JD naturalness example:
  - Avoid: "Designed … covering extraction, validation, transformation, loading, schema differences, duplicate records, incremental updates … analytics, applications, and AI/ML workloads."
  - Prefer: "Designed end-to-end ETL pipelines for heterogeneous retail-operations sources, handling schema variation, duplicate records, validation, and incremental updates to produce consistent data for analytics and AI/ML workloads."
- Lower \`jdTailoringWeight\`: stay grounded in \`roleContext\` and STAR materials with reduced JD keyword density; do not insert bullets unrelated to both the JD and the materials — keep the employer block coherent with the overall resume narrative.

## Summary
Write 3–5 sentences. The first sentence MUST open with "+{N} years of experience" (or the equivalent in \`run.language\`), where N is the total derived from the sum of each company's employment period (\`companies[].startDate\`–\`endDate\`). Express that total accurately; do not inflate it to match JD requirements. Continue the first sentence with core expertise and domain focus from the materials (what you build or deliver), not job-search phrasing. Sentences 2–4 demonstrate role fit through concrete proofs from rewritten experiences that match Top Hiring Signals and Technical Requirements.
Do not write meta job-search language (for example "targeting [Role.title] roles", "seeking", "applying for", or "open to"). The resume shows fit through expertise and proofs; it does not announce application intent.
Do not introduce skills that are not in the materials.

## Skills
Build 4–5 skill groups. Include 12–20 skill items in total across all groups for senior depth.
Source in this order:
1. Intersection of Technical Requirements / Critical JD Terminology with experience materials (\`actions\`, \`category\`).
2. Strong technologies from linked experience materials even when not in the JD (secondary groups).
3. Mentioned-only JD items only when they also appear in the materials.
Do not copy the full JD skill list. Do not fill Verdict missing-skill questions. Do not leave Skills sparse when the materials support more grounded items.

## Education
When Profile includes university / graduation year / degree, emit one \`education[]\` entry.
- \`institution\`: Profile university
- \`degree\` / \`field\`: from Profile degree when present
- \`endDate\`: Profile graduation year only (for example \`2018\`). Do not include graduation month.
- Omit \`startDate\` unless the input explicitly provides an enrollment year.

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
