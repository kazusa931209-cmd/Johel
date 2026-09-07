import { ButtonHTMLAttributes } from "react";
import {
  CopyIcon,
  EyeIcon,
  PencilIcon,
  PlusIcon,
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
  "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border hover:bg-surface-muted disabled:opacity-60";

const rowActionButtonClass = `${iconButtonClass} cursor-default`;

export function AddButton({
  label = "Add",
  showLabel = false,
  className,
  ...props
}: ActionButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={
        className ??
        (showLabel
          ? "inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-sm hover:bg-surface-muted disabled:opacity-60"
          : iconButtonClass)
      }
      {...props}
    >
      <PlusIcon className="h-4 w-4" />
      {showLabel ? <span>{label}</span> : null}
    </button>
  );
}

export function EditButton({
  label = "Edit",
  showLabel = false,
  className,
  ...props
}: ActionButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={
        className ??
        (showLabel
          ? "inline-flex cursor-default items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-sm hover:bg-surface-muted disabled:opacity-60"
          : rowActionButtonClass)
      }
      {...props}
    >
      <PencilIcon className="h-4 w-4" />
      {showLabel ? <span>{label}</span> : null}
    </button>
  );
}

export function DeleteButton({
  label = "Delete",
  showLabel = false,
  className,
  ...props
}: ActionButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={
        className ??
        (showLabel
          ? "inline-flex cursor-default items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-sm text-danger hover:bg-surface-muted disabled:opacity-60"
          : `${rowActionButtonClass} text-danger`)
      }
      {...props}
    >
      <TrashIcon className="h-4 w-4" />
      {showLabel ? <span>{label}</span> : null}
    </button>
  );
}

export function ViewButton({
  label = "View",
  showLabel = false,
  className,
  ...props
}: ActionButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={
        className ??
        (showLabel
          ? "inline-flex cursor-default items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-sm hover:bg-surface-muted disabled:opacity-60"
          : rowActionButtonClass)
      }
      {...props}
    >
      <EyeIcon className="h-4 w-4" />
      {showLabel ? <span>{label}</span> : null}
    </button>
  );
}

export function CopyButton({
  label = "Copy",
  showLabel = false,
  className,
  ...props
}: ActionButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={
        className ??
        (showLabel
          ? "inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-sm hover:bg-surface-muted disabled:opacity-60"
          : iconButtonClass)
      }
      {...props}
    >
      <CopyIcon className="h-4 w-4" />
      {showLabel ? <span>{label}</span> : null}
    </button>
  );
}

export function CloseButton({
  label = "Close",
  showLabel = false,
  className,
  ...props
}: ActionButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={
        className ??
        (showLabel
          ? "inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-sm hover:bg-surface-muted disabled:opacity-60"
          : iconButtonClass)
      }
      {...props}
    >
      <XIcon className="h-4 w-4" />
      {showLabel ? <span>{label}</span> : null}
    </button>
  );
}
