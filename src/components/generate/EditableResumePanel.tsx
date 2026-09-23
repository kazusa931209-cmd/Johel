"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  markdownToResume,
  resumeToMarkdown,
  type GeneratedResume,
} from "@johel/resume";
import { useT } from "@/components/app/LocaleProvider";
import { GeneratePanelHeaderActions } from "@/components/generate/GeneratePanelHeaderActions";
import { ResumeMarkdown } from "@/components/shared/ResumeMarkdown";
import { hashResumeForCache } from "@/lib/generate-session";

type EditableResumeMode = "edit" | "preview";

type EditableResumePanelProps = {
  resume: GeneratedResume;
  onResumeChange: (resume: GeneratedResume) => void;
  onDraftCommitted?: (resume: GeneratedResume) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onHeaderRightChange?: (node: ReactNode | null) => void;
};

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-sm text-danger">{message}</p>;
}

export function EditableResumePanel({
  resume,
  onResumeChange,
  onDraftCommitted,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onHeaderRightChange,
}: EditableResumePanelProps) {
  const t = useT();
  const [mode, setMode] = useState<EditableResumeMode>("preview");
  const [draft, setDraft] = useState(() => resumeToMarkdown(resume));
  const [parseError, setParseError] = useState<string | undefined>();
  const resumeHashRef = useRef(hashResumeForCache(resume));
  const debounceRef = useRef<number | null>(null);

  useEffect(() => {
    const nextHash = hashResumeForCache(resume);
    if (nextHash === resumeHashRef.current) return;
    resumeHashRef.current = nextHash;
    setDraft(resumeToMarkdown(resume));
    setParseError(undefined);
  }, [resume]);

  const commitDraft = useCallback(
    (markdown: string) => {
      const parsed = markdownToResume(markdown);
      if (!parsed.success) {
        setParseError(parsed.error);
        return;
      }
      setParseError(undefined);
      const nextHash = hashResumeForCache(parsed.data);
      if (nextHash !== resumeHashRef.current) {
        resumeHashRef.current = nextHash;
        onResumeChange(parsed.data);
        onDraftCommitted?.(parsed.data);
      }
    },
    [onDraftCommitted, onResumeChange],
  );

  useEffect(() => {
    if (mode !== "edit") return;
    if (debounceRef.current != null) {
      window.clearTimeout(debounceRef.current);
    }
    debounceRef.current = window.setTimeout(() => {
      debounceRef.current = null;
      commitDraft(draft);
    }, 500);
    return () => {
      if (debounceRef.current != null) {
        window.clearTimeout(debounceRef.current);
        debounceRef.current = null;
        commitDraft(draft);
      }
    };
  }, [commitDraft, draft, mode]);

  const headerNode = useMemo(
    () => (
      <GeneratePanelHeaderActions
        text={draft}
        trailing={
          <>
            <button
              type="button"
              onClick={onUndo}
              disabled={!canUndo}
              className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-surface-muted disabled:opacity-40"
              aria-label={t("generate.generateStep.undo")}
            >
              {t("generate.generateStep.undo")}
            </button>
            <button
              type="button"
              onClick={onRedo}
              disabled={!canRedo}
              className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-surface-muted disabled:opacity-40"
              aria-label={t("generate.generateStep.redo")}
            >
              {t("generate.generateStep.redo")}
            </button>
            <button
              type="button"
              onClick={() =>
                setMode((current) => (current === "edit" ? "preview" : "edit"))
              }
              className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-surface-muted"
            >
              {mode === "edit"
                ? t("generate.generateStep.previewMode")
                : t("generate.generateStep.editMode")}
            </button>
          </>
        }
      />
    ),
    [canRedo, canUndo, draft, mode, onRedo, onUndo, t],
  );

  const onHeaderRightChangeRef = useRef(onHeaderRightChange);
  onHeaderRightChangeRef.current = onHeaderRightChange;

  useEffect(() => {
    onHeaderRightChangeRef.current?.(headerNode);
  }, [headerNode]);

  useEffect(() => {
    return () => {
      onHeaderRightChangeRef.current?.(null);
    };
  }, []);

  if (mode === "preview") {
    return (
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto">
        <p className="text-xs text-muted">{t("generate.generateStep.editHint")}</p>
        <ResumeMarkdown markdown={draft} />
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden">
      <p className="shrink-0 text-xs text-muted">{t("generate.generateStep.editHint")}</p>
      <div className="relative min-h-0 flex-1">
        <textarea
          value={draft}
          onChange={(event) => {
            setDraft(event.target.value);
            if (parseError) setParseError(undefined);
          }}
          aria-invalid={Boolean(parseError)}
          className="absolute inset-0 h-full w-full resize-none overflow-y-auto rounded-md border border-border bg-background px-3 py-2 font-mono text-sm outline-none focus:border-muted"
        />
      </div>
      <FieldError
        message={
          parseError ? t("generate.generateStep.parseError", { error: parseError }) : undefined
        }
      />
    </div>
  );
}
