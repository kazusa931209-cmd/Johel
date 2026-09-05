import { Agent, CursorAgentError } from "@cursor/sdk";
import type { RunResult } from "@cursor/sdk";
import { buildUsage } from "../ai-verdict/types.js";
import type { AiProviderId } from "../ai-provider.js";
import {
  buildPromptRewriteUserMessage,
  getPromptRewriteSystemMessage,
} from "./rewrite-prompts.js";

export type PromptRewriteResult = {
  text: string;
  usage: ReturnType<typeof buildUsage>;
};

export async function runCursorPromptRewrite(
  apiKey: string,
  compiledInstruction: string,
): Promise<PromptRewriteResult> {
  const system = getPromptRewriteSystemMessage();
  const user = buildPromptRewriteUserMessage(compiledInstruction);
  const prompt = `${system}\n\n${user}`;

  try {
    const result: RunResult = await Agent.prompt(prompt, {
      apiKey,
      model: { id: "auto" },
      local: { cwd: process.cwd() },
    });

    if (result.status === "error") {
      throw new Error(result.error?.message || "Cursor AI Agent run failed.");
    }

    const text = (result.result ?? "").trim();
    if (!text) {
      throw new Error("Cursor AI Agent returned empty rewrite.");
    }

    return {
      text,
      usage: buildUsage(prompt, text, {
        inputToken: result.usage?.inputTokens,
        outputToken: result.usage?.outputTokens,
      }),
    };
  } catch (err) {
    if (err instanceof CursorAgentError) {
      throw new Error(
        err.message || "Cursor AI Agent failed to start. Check the API key.",
      );
    }
    throw err;
  }
}

export async function runPromptRewrite(
  provider: AiProviderId,
  apiKey: string,
  compiledInstruction: string,
): Promise<PromptRewriteResult> {
  if (provider === "cursor") {
    return runCursorPromptRewrite(apiKey, compiledInstruction);
  }
  const { runOpenAiPromptRewrite } = await import("./openai-rewrite.js");
  return runOpenAiPromptRewrite(apiKey, compiledInstruction);
}
