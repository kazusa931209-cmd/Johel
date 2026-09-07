"use client";

import { useState } from "react";
import { useAiUsage } from "@/components/app/AiUsageProvider";
import { useToast } from "@/components/app/ToastProvider";
import { DetailDialog } from "@/components/shared/detail-dialog";
import {
  appendPromptHelperText,
  PROMPT_HELPER_REQUEST_MAX,
} from "@/lib/prompts";
import { runAiPromptHelper, type PromptHelperKind } from "@/lib/api";

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-sm text-danger">{message}</p>;
}

type PromptHelperDialogProps = {
  kind: PromptHelperKind;
  fieldLabel: string;
  currentText: string;
  onClose: () => void;
  onSuccess: (nextText: string) => void;
};

export function PromptHelperDialog({
  kind,
  fieldLabel,
  currentText,
  onClose,
  onSuccess,
}: PromptHelperDialogProps) {
  const { toast } = useToast();
  const { refreshTokenUsed, setTokenUsed } = useAiUsage();
  const [request, setRequest] = useState("");
  const [requestError, setRequestError] = useState<string>();
  const [creating, setCreating] = useState(false);

  async function onCreate() {
    if (!request.trim()) {
      setRequestError("Describe what to add.");
      return;
    }

    setCreating(true);
    const res = await runAiPromptHelper({
      kind,
      request: request.trim(),
    });
    setCreating(false);

    if (res.error || !res.data) {
      toast(res.error ?? "Prompt helper failed.", "error");
      return;
    }

    setTokenUsed(res.data.tokenUsed);
    await refreshTokenUsed();
    onSuccess(appendPromptHelperText(currentText, res.data.sentence));
    toast("One sentence added.", "success");
    onClose();
  }

  return (
    <DetailDialog
      title={`Add one sentence to ${fieldLabel}`}
      onClose={onClose}
      closeDisabled={creating}
      dismissOnBackdrop={!creating}
      onKeyDown={(e) => {
        if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
          e.preventDefault();
          void onCreate();
        }
      }}
    >
      <p className="text-muted">
        Describe what to add (max {PROMPT_HELPER_REQUEST_MAX} characters).{" "}
        <strong className="font-medium text-foreground">Create</strong> generates
        exactly one new sentence from your description, appended under a{" "}
        <code className="text-foreground">## New</code> heading.
      </p>
      <label className="block space-y-1 text-sm">
        <span>
          What to add
          <span className="ml-0.5 text-danger" aria-hidden>
            *
          </span>
        </span>
        <textarea
          value={request}
          onChange={(e) => {
            const next = e.target.value.slice(0, PROMPT_HELPER_REQUEST_MAX);
            setRequest(next);
            if (requestError) setRequestError(undefined);
          }}
          rows={4}
          maxLength={PROMPT_HELPER_REQUEST_MAX}
          aria-invalid={Boolean(requestError)}
          disabled={creating}
          className="w-full rounded-md border border-border bg-background px-3 py-2 outline-none focus:border-muted disabled:opacity-60"
        />
        <div className="flex items-start justify-between gap-2">
          <FieldError message={requestError} />
          <span className="ml-auto shrink-0 text-xs text-muted">
            {request.length.toLocaleString()} /{" "}
            {PROMPT_HELPER_REQUEST_MAX.toLocaleString()}
          </span>
        </div>
      </label>
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => void onCreate()}
          disabled={creating}
          className="rounded-md bg-accent px-3 py-2 text-sm font-medium text-accent-fg hover:opacity-90 disabled:opacity-60"
        >
          {creating ? "Creating…" : "Create"}
        </button>
      </div>
    </DetailDialog>
  );
}
