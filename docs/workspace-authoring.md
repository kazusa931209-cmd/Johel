# Workspace authoring

How to write **Companies**, **Experiences**, and **Workflows** so resume generation can multiply them cleanly. Product fields live in [`specification.md`](./specification.md). How those fields are assembled into the Generate user message lives in [`technology.md`](./technology.md).

JoHEL does not invent employers, tools, or metrics. Quality depends on what you store here and on the user-defined prompts.

## Mental model

Generation is:

**company scene × linked capability cards × job rubric**

| Piece | What it is | What it is not |
| --- | --- | --- |
| **Company** | The scene: industry, product, customer, domain, stack, scale | Personal achievements, before→after metrics, “I built…” |
| **Experience** | One capability unit (STAR: problem, actions, outcome) | A whole employer, a whole career, or a stack dump |
| **Workflow** | Which profile, which companies in résumé order, which cards attach to which company, plus emphasis | A second copy of the JD or a list of metrics |
| **Prompts** | How to read the JD (Verdict), how to write (Generate), how to score (Evaluate) | A place to store facts that belong on Company or Experience |

If a fact is “this place was an early-stage Web3 startup at 50K events/day”, it belongs on **Company**. If a fact is “I cut failure rate from 2.1% to 0.1% by fixing nonce conflicts”, it belongs on **that Experience’s Outcome**.

## Company

Fields: **alias**, **name**, **what this company is**, **domain & stack**.  
On the workflow entry (not the company record): **start**, **end**, **role context**.

### What this company is

One sentence: industry, product, customer. Not a résumé bullet.

Good:

```text
Early-stage Web3 startup building blockchain, messaging, and event-driven production systems for a global team.
```

```text
AI-powered retail management SaaS for independent retailers, covering inventory, customers, and store operations.
```

Bad:

```text
Here I designed microservices and reduced latency by 30%.
```

```text
Use this company when the JD asks for startup experience.
```

The first bad example is a personal achievement. The second is a routing instruction. Generate will treat both as scene and may paste them as if the *employer* did that work.

### Domain & stack

What the company handles, which tech it uses, regulation/scale. Snapshot numbers (what the product bears) are fine. Improvement arrows (`3s → 200ms`) are not.

Good:

```text
- **Domain**
  Web3, blockchain transactions, messaging, and high-volume event processing
- **Stack**
  Backend, databases, cloud infrastructure, blockchain, and AI (OpenAI)
- **Scale**
  50K+ events/day, 10K blockchain transactions/day
```

Bad:

```text
- **Latency**
  I reduced processing latency from 3s to 200ms.
- **Ownership**
  Took end-to-end ownership of every product.
```

Those sentences will repeat on every company that later links the same shared experience, or leak AllWeb3 numbers onto ScalyX if you copy the block.

### Role context (workflow company entry)

Nature of the role in that employment. Primary hint for the résumé `title`. Not achievements.

Good: `Engineer with end-to-end product ownership on a global Agile team`  
Bad: `Cut infra cost from $3K to $1.2K and shipped 0→1 products`

## Experience

Fields: **category**, **problem**, **actions**, **outcome**. All are used as resume-generation prompts.

One card = one capability. Target size: Problem 2–4 bullets, Actions 3–6, Outcome 1–3.

Do **not** put employer or company names in **category**, **problem**, **actions**, or **outcome**. The card is shared across workflow company links; the employer name comes from the workflow company entry at generation time.

Format each item as a bullet with a bold label and an indented body:

```text
- **Label**
  Description continues here, indented.
```

### Category

A work cluster used when choosing the résumé title and skill groups. Prefer the **capability**, and add the stack only when you keep intentional variants (see below).

Good: `On-chain Transaction Sync (Go/Rust)`  
Good: `Multi-tenant Retail APIs`  
Bad: `Senior Backend / Platform Engineer - Web3 & EVM` (a job title, not a capability)  
Bad: `Numeric Evidence` (a bucket of leftover numbers)  
Bad: `Startup Experience` (a JD keyword, not work you did)

### Problem

What was wrong or hard. Situation only.

Good:

```text
- **Shared-wallet nonce conflicts**
  Several backend replicas and workers shared one operator wallet, which caused nonce clashes, duplicate sends, and inconsistent transaction state.
```

Bad:

```text
- **Blockchain**
  Implemented durable transaction intents, send leases, and EIP-1559 gas policies.
```

That bad line is an action stuffed into Problem. Generate already uses Actions as the verb.

### Actions

Verb + object, plus the tech/methods. Do not restate the whole company stack.

Good:

```text
- **Send leases**
  Coordinated nonce assignment with PostgreSQL-backed send leases, idempotency keys, and EIP-1559 gas policies.
```

Bad:

```text
- **Everything**
  Built the platform with Python, FastAPI, Redis, PostgreSQL, Next.js, OpenAI, Docker, AWS, and Agile, and also mentored the team.
```

### Outcome

Result of **this card only**. Put a number only when you have it and it belongs to this work. Do not paste a career-wide metrics list onto every card.

Good (on an AI-matching card):

```text
- **AI efficiency**
  Reduced OpenAI API calls by 40% by embedding once and matching at query time.
```

Bad (on the same card):

```text
- **Latency**
  Reduced processing latency from 3s to 200ms.
- **Deployment time**
  Shortened deployment from 15 minutes to 5 minutes.
- **Cross-timezone delivery**
  Kept a global Agile team aligned.
```

Latency belongs on the sync/performance card. Deploy time belongs on the production-ops card. Cross-timezone delivery is not an outcome of embeddings.

Empty Outcome is allowed only when you truly have no result; a short qualitative line is better than silence.

## Splitting dense cards

If Problem has 8–12 items that are not the same failure mode, split.

| Keep together | Split apart |
| --- | --- |
| Nonce conflicts + stuck intents + event order | Nonce conflicts + OpenAI cost + EC2 OOM |
| Tenant isolation + inventory consistency | Tenant isolation + “worked in a global startup” |
| BFF token hiding + logout cache purge | BFF token hiding + on-chain campaign UI |

**Company-specific work must not ride on a shared card that you also link to another company.** A Frontend card that contains Privy/Wagmi campaign flows is AllWeb3 material. Linking it to ScalyX writes Web3 bullets onto a retail SaaS employer.

**Infra that is not the capability should not live on the capability card.** Redis Streams used for notifications belongs on the notifications card, not on “AWS”.

## Stack variants (intentional duplicates)

The same capability may exist as two cards that differ only by stack (for example NestJS vs Go/Rust). That is valid when a JD may ask for one stack or the other.

- Keep **Problem** and **Outcome** aligned across the pair.
- Change **Category** and **Actions** so the stack is explicit.
- **Do not link both variants to the same company in the same workflow.** JoHEL will not de-duplicate them. Each linked card becomes 1–3 résumé bullets, so both variants double the same story. Choosing one variant per workflow company entry is the author’s responsibility.

Good workflow: AllWeb3 → `On-chain Transaction Sync (Go/Rust)` only.  
Bad workflow: AllWeb3 → both the NestJS and the Go on-chain cards.

## Workflow

A workflow is a preset: one profile, ordered company entries, language, and a description used as emphasis.

### Linking

- Link a card only if that work actually happened at that company.
- Same shared card may appear under more than one company **only when the STAR facts are true in both scenes**.
- Prefer 2–5 cards per company. One linked card → 1–3 bullets.

Good: ScalyX → Multi-tenant Retail APIs + AI-assisted Retail Workflows.  
Bad: ScalyX → those two **plus** the AllWeb3 AWS card (PM2, Base chain, S3 Object Lock).

### Description vs One-time Prompt

- **Workflow description** — stable persona and emphasis for this preset (“Go/blockchain engineer, lead with on-chain reliability”).
- **One-time Prompt** (Generate step) — this run only (“Emphasize startup scene; keep Skills to backend”).

Neither is a place to dump metrics or to say “use the Startup Experience card”.

Good description:

```text
Target a senior backend / blockchain role. Prefer on-chain reliability and event sync. Do not invent Web2 retail work.
```

Bad description:

```text
Latency 3s→200ms, 50K events/day, 40% fewer OpenAI calls. Mention startup experience whenever the JD asks.
```

Those facts belong on Company (scale) or Experience (outcomes). Putting them in the workflow description invites the model to attach every number to every company.

## Relationship to user-defined prompts

```text
Verdict Prompt  → reads the JD → job rubric (Role, Technical Requirements, …)
Generate Prompt → reads rubric + workspace fields → résumé JSON
Evaluate Prompt → reads rubric + résumé → score
```

Default Generate Prompt (`@johel/prompt-defaults`) maps fields like this:

| Workspace field | Generate use |
| --- | --- |
| `whatCompanyIs` / `domainAndStack` | Scene wording. Not pasted as bullets. |
| `roleContext` | Primary hint for experience `title`. |
| `experiences[].category` | Title blend and skill grouping. |
| `problem` | Situation, only when it clarifies impact. |
| `actions` | Lead of each bullet (verb + object + tech). |
| `outcome` | Close of the bullet when present. |
| `workflow.description` | Persona / what to emphasize or omit. |
| Job context (Verdict or filtered JD) | **Only** scoring rubric. Company and Experience are not the job target. |

Changing Prompts changes *how* materials are read. It does not add missing facts. If ScalyX has no Outcome numbers, no Generate Prompt will honestly create them.

**Do not** put authoring rules that belong here into Experience Actions (“Use this when the JD lists startup experience”). That is prompt logic, not STAR material.

| Need | Where |
| --- | --- |
| Always-on writing rules | Generate Prompt |
| This-preset emphasis | Workflow description |
| This-run emphasis | One-time Prompt |
| Employer scene | Company |
| What you did and what changed | Experience |

## Worked contrast

**AllWeb3 (scene)** — Web3 / campaigns / operator wallet / constrained EC2.  
**ScalyX.ai (scene)** — multi-tenant retail SaaS / FastAPI / embeddings for store ops.

Good split:

- AllWeb3 links on-chain sync, notifications, AI matching (or fraud), production ops, and (optionally) Web3 frontend — **one stack variant each**.
- ScalyX links retail APIs and AI storefronts only.
- AllWeb3 scale snapshots stay on AllWeb3 Domain & Stack.
- AllWeb3 improvement arrows stay on the AllWeb3 card that produced them.

Bad split:

- One “Backend” card with 12 problems (nonce + notifications + OpenAI + fraud + EC2) linked to both companies.
- A “Numeric Evidence” card with every career number, linked everywhere.
- A “Startup Experience” card whose Actions say “use when the JD asks for startup”, linked to ScalyX and AllWeb3.
- NestJS and Go twins both linked under AllWeb3 in the same workflow.

## Quick Experience

When facts are missing or misplaced, use **Quick Experience** (plus FAB) instead of editing Verdict / Generate / Evaluate prompts. The advisor places content on **Company** (scene), **Experience** (STAR), or **Workflow** links/description per the rules above. Optional workflow selection scopes the graph to one preset; with no selection, all workflows are included.
