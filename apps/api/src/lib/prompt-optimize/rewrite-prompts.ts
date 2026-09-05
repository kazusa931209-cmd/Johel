const REWRITE_SYSTEM = `You rewrite user-authored instructions for an AI resume system.

Output ONLY the rewritten instruction text. Do not wrap the answer in a code fence.
Do not add output format rules, JSON schemas, Markdown section headings, or provider notes.
Preserve the user's intent. Do not add new facts, employers, dates, skills, or requirements.
Make unclear instructions clearer and more actionable.`;

export function buildPromptRewriteUserMessage(compiledInstruction: string): string {
  return `Rewrite the following instruction for clarity:

---
${compiledInstruction}
---`;
}

export function getPromptRewriteSystemMessage(): string {
  return REWRITE_SYSTEM;
}
