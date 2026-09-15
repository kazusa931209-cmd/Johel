"use client";

import { ButtonHTMLAttributes } from "react";
import { useT } from "@/components/app/LocaleProvider";
import {
  CopyIcon,
  EyeIcon,
  PencilIcon,
  PlayIcon,
  PlusIcon,
  SplitIcon,
  TrashIcon,
  XIcon,
} from "@/components/shared/icons";

type ActionButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "children" | "type"
> & {
  label?: string;
  showLabel?: boolean;
};

const iconButtonClass =
  "inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-md border border-border hover:bg-surface-muted disabled:opacity-60";

const rowActionButtonClass = iconButtonClass;

export function AddButton({
  label,
  showLabel = false,
  className,
  ...props
}: ActionButtonProps) {
  const t = useT();
  const resolvedLabel = label ?? t("shared.actions.add");
  return (
    <button
      type="button"
      aria-label={resolvedLabel}
      title={resolvedLabel}
      className={
        className ??
        (showLabel
          ? "inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-sm hover:bg-surface-muted disabled:opacity-60"
          : iconButtonClass)
      }
      {...props}
    >
      <PlusIcon className="h-4 w-4" />
      {showLabel ? <span>{resolvedLabel}</span> : null}
    </button>
  );
}

export function EditButton({
  label,
  showLabel = false,
  className,
  ...props
}: ActionButtonProps) {
  const t = useT();
  const resolvedLabel = label ?? t("shared.actions.edit");
  return (
    <button
      type="button"
      aria-label={resolvedLabel}
      title={resolvedLabel}
      className={
        className ??
        (showLabel
          ? "inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-sm hover:bg-surface-muted disabled:opacity-60"
          : rowActionButtonClass)
      }
      {...props}
    >
      <PencilIcon className="h-4 w-4" />
      {showLabel ? <span>{resolvedLabel}</span> : null}
    </button>
  );
}

export function SplitButton({
  label,
  showLabel = false,
  className,
  ...props
}: ActionButtonProps) {
  const t = useT();
  const resolvedLabel = label ?? t("crud.experiences.split.actionAria");
  return (
    <button
      type="button"
      aria-label={resolvedLabel}
      title={resolvedLabel}
      className={
        className ??
        (showLabel
          ? "inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-sm hover:bg-surface-muted disabled:opacity-60"
          : rowActionButtonClass)
      }
      {...props}
    >
      <SplitIcon className="h-4 w-4" />
      {showLabel ? <span>{resolvedLabel}</span> : null}
    </button>
  );
}

export function DeleteButton({
  label,
  showLabel = false,
  className,
  ...props
}: ActionButtonProps) {
  const t = useT();
  const resolvedLabel = label ?? t("shared.actions.delete");
  return (
    <button
      type="button"
      aria-label={resolvedLabel}
      title={resolvedLabel}
      className={
        className ??
        (showLabel
          ? "inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-sm text-danger hover:bg-surface-muted disabled:opacity-60"
          : `${rowActionButtonClass} text-danger`)
      }
      {...props}
    >
      <TrashIcon className="h-4 w-4" />
      {showLabel ? <span>{resolvedLabel}</span> : null}
    </button>
  );
}

export function ResumeButton({
  label,
  showLabel = false,
  className,
  ...props
}: ActionButtonProps) {
  const t = useT();
  const resolvedLabel = label ?? t("shared.actions.resume");
  return (
    <button
      type="button"
      aria-label={resolvedLabel}
      title={resolvedLabel}
      className={
        className ??
        (showLabel
          ? "inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-sm hover:bg-surface-muted disabled:opacity-60"
          : rowActionButtonClass)
      }
      {...props}
    >
      <PlayIcon className="h-4 w-4" />
      {showLabel ? <span>{resolvedLabel}</span> : null}
    </button>
  );
}

export function ViewButton({
  label,
  showLabel = false,
  className,
  ...props
}: ActionButtonProps) {
  const t = useT();
  const resolvedLabel = label ?? t("shared.actions.view");
  return (
    <button
      type="button"
      aria-label={resolvedLabel}
      title={resolvedLabel}
      className={
        className ??
        (showLabel
          ? "inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-sm hover:bg-surface-muted disabled:opacity-60"
          : rowActionButtonClass)
      }
      {...props}
    >
      <EyeIcon className="h-4 w-4" />
      {showLabel ? <span>{resolvedLabel}</span> : null}
    </button>
  );
}

export function CopyButton({
  label,
  showLabel = false,
  className,
  ...props
}: ActionButtonProps) {
  const t = useT();
  const resolvedLabel = label ?? t("shared.actions.copy");
  return (
    <button
      type="button"
      aria-label={resolvedLabel}
      title={resolvedLabel}
      className={
        className ??
        (showLabel
          ? "inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-sm hover:bg-surface-muted disabled:opacity-60"
          : iconButtonClass)
      }
      {...props}
    >
      <CopyIcon className="h-4 w-4" />
      {showLabel ? <span>{resolvedLabel}</span> : null}
    </button>
  );
}

export function CloseButton({
  label,
  showLabel = false,
  className,
  ...props
}: ActionButtonProps) {
  const t = useT();
  const resolvedLabel = label ?? t("shared.actions.close");
  return (
    <button
      type="button"
      aria-label={resolvedLabel}
      title={resolvedLabel}
      className={
        className ??
        (showLabel
          ? "inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-sm hover:bg-surface-muted disabled:opacity-60"
          : iconButtonClass)
      }
      {...props}
    >
      <XIcon className="h-4 w-4" />
      {showLabel ? <span>{resolvedLabel}</span> : null}
    </button>
  );
}
