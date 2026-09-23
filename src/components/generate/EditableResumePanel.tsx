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
  onResumePersist?: () => void | Promise<void>;
  onHeaderRightChange?: (node: ReactNode | null) => void;
  onFooterChange?: (node: ReactNode | null) => void;
};

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-sm text-danger">{message}</p>;
}

export function EditableResumePanel({
  resume,
  onResumeChange,
  onResumePersist,
  onHeaderRightChange,
  onFooterChange,
}: EditableResumePanelProps) {
  const t = useT();
  const [mode, setMode] = useState<EditableResumeMode>("preview");
  const [draft, setDraft] = useState(() => resumeToMarkdown(resume));
  const [parseError, setParseError] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);
  const resumeHashRef = useRef(hashResumeForCache(resume));

  useEffect(() => {
    const nextHash = hashResumeForCache(resume);
    if (nextHash === resumeHashRef.current) return;
    resumeHashRef.current = nextHash;
    setDraft(resumeToMarkdown(resume));
    setParseError(undefined);
    setMode("preview");
  }, [resume]);

  const handleSave = useCallback(async () => {
    const parsed = markdownToResume(draft);
    if (!parsed.success) {
      setParseError(parsed.error);
      return;
    }
    setParseError(undefined);
    const nextHash = hashResumeForCache(parsed.data);
    if (nextHash === resumeHashRef.current) {
      setMode("preview");
      return;
    }

    setSaving(true);
    try {
      resumeHashRef.current = nextHash;
      onResumeChange(parsed.data);
      await onResumePersist?.();
      setMode("preview");
    } finally {
      setSaving(false);
    }
  }, [draft, onResumeChange, onResumePersist]);

  const headerNode = useMemo(
    () => <GeneratePanelHeaderActions text={draft} />,
    [draft],
  );

  const footerNode = useMemo(() => {
    const actions =
      mode === "preview"
        ? (
            <button
              type="button"
              onClick={() => {
                setDraft(resumeToMarkdown(resume));
                setParseError(undefined);
                setMode("edit");
              }}
              className="rounded-md bg-accent px-3 py-2 text-sm font-medium text-accent-fg hover:opacity-90"
            >
              {t("generate.generateStep.editMode")}
            </button>
          )
        : (
            <>
              <button
                type="button"
                onClick={() => {
                  setDraft(resumeToMarkdown(resume));
                  setParseError(undefined);
                  setMode("preview");
                }}
                disabled={saving}
                className="rounded-md border border-border px-3 py-2 text-sm hover:bg-surface-muted disabled:opacity-40"
              >
                {t("generate.generateStep.cancelEdit")}
              </button>
              <button
                type="button"
                onClick={() => void handleSave()}
                disabled={saving}
                className="rounded-md bg-accent px-3 py-2 text-sm font-medium text-accent-fg hover:opacity-90 disabled:opacity-60"
              >
                {saving
                  ? t("generate.generateStep.savingDraft")
                  : t("generate.generateStep.saveDraft")}
              </button>
            </>
          );

    return (
      <div className="flex w-full min-w-0 items-center justify-between gap-3">
        <p className="min-w-0 text-left text-xs text-muted">
          {t("generate.generateStep.editHint")}
        </p>
        <div className="flex shrink-0 items-center gap-2">{actions}</div>
      </div>
    );
  }, [handleSave, mode, resume, saving, t]);

  const onHeaderRightChangeRef = useRef(onHeaderRightChange);
  onHeaderRightChangeRef.current = onHeaderRightChange;
  const onFooterChangeRef = useRef(onFooterChange);
  onFooterChangeRef.current = onFooterChange;

  useEffect(() => {
    onHeaderRightChangeRef.current?.(headerNode);
  }, [headerNode]);

  useEffect(() => {
    onFooterChangeRef.current?.(footerNode);
  }, [footerNode]);

  useEffect(() => {
    return () => {
      onHeaderRightChangeRef.current?.(null);
      onFooterChangeRef.current?.(null);
    };
  }, []);

  if (mode === "preview") {
    return (
      <div className="min-h-0 flex-1 overflow-y-auto">
        <ResumeMarkdown markdown={draft} />
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden">
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
