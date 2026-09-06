"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { BackButton } from "@/components/shared/back-button";
import { AddButton } from "@/components/shared/action-icon-buttons";
import { PromptHelperDialog } from "@/components/PromptHelperDialog";
import { useToast } from "@/components/app/ToastProvider";
import {
  createExperience,
  updateExperience,
  type ExperienceDetail,
  type ExperienceWritePayload,
} from "@/lib/api";

type ExperienceFormProps = {
  mode: "create" | "edit";
  experienceId?: string;
  initial?: Partial<ExperienceDetail>;
};

type FieldErrors = {
  category?: string;
  description?: string;
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

export function ExperienceForm({
  mode,
  experienceId,
  initial,
}: ExperienceFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [category, setCategory] = useState(initial?.category ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [helperOpen, setHelperOpen] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const nextErrors: FieldErrors = {};
    if (!category.trim()) {
      nextErrors.category = "Category is required.";
    }
    if (!description.trim()) {
      nextErrors.description = "Description is required.";
    }
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    const payload: ExperienceWritePayload = {
      category: category.trim(),
      description: description.trim(),
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
    toast(
      mode === "edit" ? "Experience updated." : "Experience created.",
      "success",
    );
    router.push("/experiences");
  }

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
          Configure category and description for this experience.
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
        <div className="flex items-center justify-between gap-2">
          <span>
            Description
            <RequiredMark />
          </span>
          <AddButton
            label="Add to Description"
            onClick={() => setHelperOpen(true)}
          />
        </div>
        <textarea
          value={description}
          onChange={(e) => {
            setDescription(e.target.value);
            if (fieldErrors.description) {
              setFieldErrors((errors) => ({
                ...errors,
                description: undefined,
              }));
            }
          }}
          rows={24}
          aria-invalid={Boolean(fieldErrors.description)}
          className="w-full rounded-md border border-border bg-background px-3 py-2 outline-none focus:border-muted"
        />
        <FieldError message={fieldErrors.description} />
      </label>

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

      {helperOpen ? (
        <PromptHelperDialog
          kind="experienceDescription"
          fieldLabel="Description"
          currentText={description}
          onClose={() => setHelperOpen(false)}
          onSuccess={setDescription}
        />
      ) : null}
    </form>
  );
}
