"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useAiUsage } from "@/components/app/AiUsageProvider";
import { BackButton } from "@/components/shared/back-button";
import { BusyOverlay } from "@/components/shared/BusyOverlay";
import { useToast } from "@/components/app/ToastProvider";
import {
  createExperience,
  updateExperience,
  type ExperienceDetail,
  type ExperienceWritePayload,
} from "@/lib/api";
import {
  AUTO_MARKDOWN_FORMAT_HINT,
  needsMarkdownFormatOnSave,
} from "@/lib/markdown-format";
import { DESCRIPTION_AS_RESUME_PROMPT_HINT } from "@/lib/entity-description";
import {
  EXPERIENCE_ACTIONS_GOOD,
  EXPERIENCE_ACTIONS_GUIDELINE,
  EXPERIENCE_OUTCOME_GOOD,
  EXPERIENCE_OUTCOME_GUIDELINE,
  EXPERIENCE_PROBLEM_GOOD,
  EXPERIENCE_PROBLEM_GUIDELINE,
  EXPERIENCE_SHARED_GUIDANCE,
  EXPERIENCE_STRUCTURED_FIELD_FORMAT,
} from "@/lib/experience-field-guidance";

type ExperienceFormProps = {
  mode: "create" | "edit";
  experienceId?: string;
  initial?: Partial<ExperienceDetail>;
};

type FieldErrors = {
  category?: string;
  problem?: string;
  actions?: string;
  outcome?: string;
};

function RequiredMark() {
  return (
    <span className="ml-0.5 text-danger" aria-hidden>
      *
    </span>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-sm text-danger">{message}</p>;
}

function FieldExamples({ lines }: { lines: string[] }) {
  return (
    <div className="space-y-1 text-xs text-muted">
      <p>
        <span className="font-medium text-foreground">Example:</span>
      </p>
      <pre className="whitespace-pre-wrap font-sans">{lines.join("\n")}</pre>
    </div>
  );
}

export function ExperienceForm({
  mode,
  experienceId,
  initial,
}: ExperienceFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { refreshTokenUsed } = useAiUsage();
  const [category, setCategory] = useState(initial?.category ?? "");
  const [problem, setProblem] = useState(initial?.problem ?? "");
  const [actions, setActions] = useState(initial?.actions ?? "");
  const [outcome, setOutcome] = useState(initial?.outcome ?? "");
  const [storedProblem] = useState(initial?.problem ?? "");
  const [storedActions] = useState(initial?.actions ?? "");
  const [storedOutcome] = useState(initial?.outcome ?? "");
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const nextErrors: FieldErrors = {};
    if (!category.trim()) {
      nextErrors.category = "Category is required.";
    }
    if (!problem.trim()) {
      nextErrors.problem = "Problem is required.";
    }
    if (!actions.trim()) {
      nextErrors.actions = "Actions is required.";
    }
    if (!outcome.trim()) {
      nextErrors.outcome = "Outcome is required.";
    }
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    const payload: ExperienceWritePayload = {
      category: category.trim(),
      problem: problem.trim(),
      actions: actions.trim(),
      outcome: outcome.trim(),
    };
    setSaving(true);
    const res =
      mode === "edit" && experienceId
        ? await updateExperience(experienceId, payload)
        : await createExperience(payload);
    setSaving(false);
    if (res.error || !res.data) {
      toast(res.error ?? "Save failed", "error");
      return;
    }
    await refreshTokenUsed();
    toast(
      mode === "edit" ? "Experience updated." : "Experience created.",
      "success",
    );
    router.push("/experiences");
  }

  const convertingProblem = needsMarkdownFormatOnSave(problem, storedProblem);
  const convertingActions = needsMarkdownFormatOnSave(actions, storedActions);
  const convertingOutcome = needsMarkdownFormatOnSave(outcome, storedOutcome);
  const converting =
    saving && (convertingProblem || convertingActions || convertingOutcome);

  return (
    <form
      noValidate
      onSubmit={onSubmit}
      className="mx-auto flex max-w-3xl flex-col gap-6"
    >
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <BackButton href="/experiences" aria-label="Back to experiences" />
          <h1 className="text-2xl font-semibold tracking-tight">
            {mode === "edit" ? "Edit experience" : "Add experience"}
          </h1>
        </div>
        <p className="pl-12 text-sm text-muted">
          Configure category and structured fields used as resume-generation
          prompts.
        </p>
      </div>

      <label className="block space-y-1 text-sm">
        <span>
          Category
          <RequiredMark />
        </span>
        <input
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            if (fieldErrors.category) {
              setFieldErrors((errors) => ({ ...errors, category: undefined }));
            }
          }}
          aria-invalid={Boolean(fieldErrors.category)}
          className="w-full rounded-md border border-border bg-background px-3 py-2 outline-none focus:border-muted"
        />
        <FieldError message={fieldErrors.category} />
      </label>

      <label className="block space-y-1 text-sm">
        <span>
          Problem
          <RequiredMark />
        </span>
        <p className="text-xs text-muted">{EXPERIENCE_PROBLEM_GUIDELINE}</p>
        <p className="text-xs text-muted">{EXPERIENCE_STRUCTURED_FIELD_FORMAT}</p>
        <textarea
          value={problem}
          onChange={(e) => {
            setProblem(e.target.value);
            if (fieldErrors.problem) {
              setFieldErrors((errors) => ({ ...errors, problem: undefined }));
            }
          }}
          rows={6}
          aria-invalid={Boolean(fieldErrors.problem)}
          className="w-full rounded-md border border-border bg-background px-3 py-2 outline-none focus:border-muted"
        />
        <FieldExamples lines={EXPERIENCE_PROBLEM_GOOD} />
        <p className="text-xs text-muted">{DESCRIPTION_AS_RESUME_PROMPT_HINT}</p>
        <p className="text-xs text-muted">{AUTO_MARKDOWN_FORMAT_HINT}</p>
        <FieldError message={fieldErrors.problem} />
      </label>

      <label className="block space-y-1 text-sm">
        <span>
          Actions
          <RequiredMark />
        </span>
        <p className="text-xs text-muted">{EXPERIENCE_ACTIONS_GUIDELINE}</p>
        <p className="text-xs text-muted">{EXPERIENCE_STRUCTURED_FIELD_FORMAT}</p>
        <textarea
          value={actions}
          onChange={(e) => {
            setActions(e.target.value);
            if (fieldErrors.actions) {
              setFieldErrors((errors) => ({ ...errors, actions: undefined }));
            }
          }}
          rows={10}
          aria-invalid={Boolean(fieldErrors.actions)}
          className="w-full rounded-md border border-border bg-background px-3 py-2 outline-none focus:border-muted"
        />
        <FieldExamples lines={EXPERIENCE_ACTIONS_GOOD} />
        <p className="text-xs text-muted">{DESCRIPTION_AS_RESUME_PROMPT_HINT}</p>
        <p className="text-xs text-muted">{AUTO_MARKDOWN_FORMAT_HINT}</p>
        <FieldError message={fieldErrors.actions} />
      </label>

      <label className="block space-y-1 text-sm">
        <span>
          Outcome
          <RequiredMark />
        </span>
        <p className="text-xs text-muted">{EXPERIENCE_OUTCOME_GUIDELINE}</p>
        <p className="text-xs text-muted">{EXPERIENCE_STRUCTURED_FIELD_FORMAT}</p>
        <textarea
          value={outcome}
          onChange={(e) => {
            setOutcome(e.target.value);
            if (fieldErrors.outcome) {
              setFieldErrors((errors) => ({ ...errors, outcome: undefined }));
            }
          }}
          rows={6}
          aria-invalid={Boolean(fieldErrors.outcome)}
          className="w-full rounded-md border border-border bg-background px-3 py-2 outline-none focus:border-muted"
        />
        <FieldExamples lines={EXPERIENCE_OUTCOME_GOOD} />
        <p className="text-xs text-muted">{DESCRIPTION_AS_RESUME_PROMPT_HINT}</p>
        <p className="text-xs text-muted">{AUTO_MARKDOWN_FORMAT_HINT}</p>
        <FieldError message={fieldErrors.outcome} />
      </label>

      <p className="text-xs text-muted">{EXPERIENCE_SHARED_GUIDANCE}</p>

      <div className="flex justify-end gap-2 border-t border-border pt-4">
        <button
          type="button"
          onClick={() => router.push("/experiences")}
          className="rounded-md border border-border px-3 py-2 text-sm hover:bg-surface-muted"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="rounded-md bg-accent px-3 py-2 text-sm font-medium text-accent-fg"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>

      {converting ? (
        <BusyOverlay
          title="Converting to markdown…"
          description="Please wait while the fields are formatted."
        />
      ) : null}
    </form>
  );
}
