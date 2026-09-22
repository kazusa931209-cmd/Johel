"use client";

import { useMemo, useState, type DragEvent } from "react";
import { useT } from "@/components/app/LocaleProvider";
import { ExperienceDetailDialog } from "@/components/ExperienceDetailDialog";
import { CombineExperiencePickerDrawer } from "@/components/generate/CombineExperiencePickerDrawer";
import {
  AddButton,
  DeleteButton,
  ViewButton,
} from "@/components/shared/action-icon-buttons";
import { GripVerticalIcon } from "@/components/shared/icons";
import type { ExperienceDetail } from "@/lib/api";
import { usePce } from "@/lib/pce";

const experienceRowClass =
  "flex min-h-[42px] items-center gap-2 rounded-md border border-border bg-background px-3 py-2 font-mono text-sm";

function reorderExperienceIds(
  experienceIds: string[],
  fromIndex: number,
  toIndex: number,
): string[] {
  if (
    fromIndex === toIndex ||
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= experienceIds.length ||
    toIndex >= experienceIds.length
  ) {
    return experienceIds;
  }

  const next = [...experienceIds];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next;
}

type CombineCompanyExperienceListProps = {
  experienceIds: string[];
  rationale?: string;
  disabled?: boolean;
  readOnly?: boolean;
  onChange: (experienceIds: string[]) => void;
};

export function CombineCompanyExperienceList({
  experienceIds,
  rationale,
  disabled = false,
  readOnly = false,
  onChange,
}: CombineCompanyExperienceListProps) {
  const t = useT();
  const { experiences } = usePce();
  const [viewExperience, setViewExperience] = useState<ExperienceDetail | null>(
    null,
  );
  const [pickerOpen, setPickerOpen] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);

  const experienceById = useMemo(
    () => new Map(experiences.map((item) => [item.id, item])),
    [experiences],
  );

  function removeExperience(experienceId: string) {
    onChange(experienceIds.filter((id) => id !== experienceId));
  }

  function addExperience(experienceId: string) {
    if (experienceIds.includes(experienceId)) return;
    onChange([...experienceIds, experienceId]);
  }

  function handleDragStart(index: number, event: DragEvent<HTMLButtonElement>) {
    if (disabled || readOnly) return;
    setDragIndex(index);
    setDropIndex(index);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", String(index));
  }

  function handleDragOver(index: number, event: DragEvent<HTMLLIElement>) {
    if (disabled || readOnly || dragIndex === null) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    if (dropIndex !== index) {
      setDropIndex(index);
    }
  }

  function handleDrop(index: number, event: DragEvent<HTMLLIElement>) {
    event.preventDefault();
    if (disabled || readOnly || dragIndex === null) return;
    onChange(reorderExperienceIds(experienceIds, dragIndex, index));
    setDragIndex(null);
    setDropIndex(null);
  }

  function handleDragEnd() {
    setDragIndex(null);
    setDropIndex(null);
  }

  return (
    <div className="flex items-start gap-3 text-sm">
      <span className="w-36 shrink-0 pt-2">
        {t("generate.combine.linkedExperiences")}
      </span>
      <div className="min-w-0 flex-1 space-y-2">
        {!readOnly ? (
          <div className="flex justify-end">
            <AddButton
              label={t("generate.combine.linkExperienceAria")}
              disabled={disabled}
              onClick={() => setPickerOpen(true)}
            />
          </div>
        ) : null}

        {experienceIds.length === 0 ? (
          <p className="text-sm text-muted">{t("generate.combine.experiencesEmpty")}</p>
        ) : (
          <ul className="space-y-1">
            {experienceIds.map((id, index) => {
              const experience = experienceById.get(id);
              const label =
                experience?.category ??
                t("generate.combine.suggestionExperienceMissing");
              const isDragging = dragIndex === index;
              const isDropTarget =
                dropIndex === index && dragIndex !== null && dragIndex !== index;

              if (readOnly) {
                return (
                  <li key={id}>
                    <button
                      type="button"
                      onClick={() => {
                        if (experience) setViewExperience(experience);
                      }}
                      disabled={!experience}
                      className={`${experienceRowClass} w-full cursor-pointer text-left hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-60`}
                    >
                      <span className="min-w-0 flex-1 truncate">{label}</span>
                    </button>
                  </li>
                );
              }

              return (
                <li
                  key={id}
                  onDragOver={(event) => handleDragOver(index, event)}
                  onDrop={(event) => handleDrop(index, event)}
                  className={isDropTarget ? "rounded-md ring-2 ring-accent/60" : undefined}
                >
                  <div
                    className={`${experienceRowClass} ${
                      isDragging ? "opacity-50" : ""
                    }`}
                  >
                    <button
                      type="button"
                      draggable={!disabled}
                      disabled={disabled}
                      aria-label={t("generate.combine.reorderExperienceAria")}
                      onDragStart={(event) => handleDragStart(index, event)}
                      onDragEnd={handleDragEnd}
                      className="inline-flex h-8 w-8 shrink-0 cursor-grab items-center justify-center rounded-md text-muted hover:bg-surface-muted active:cursor-grabbing disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <GripVerticalIcon className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (experience) setViewExperience(experience);
                      }}
                      disabled={!experience || disabled}
                      className="min-w-0 flex-1 truncate text-left disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {label}
                    </button>
                    <div className="flex shrink-0 items-center gap-1">
                      <ViewButton
                        disabled={!experience || disabled}
                        onClick={() => {
                          if (experience) setViewExperience(experience);
                        }}
                      />
                      <DeleteButton
                        disabled={disabled}
                        onClick={() => removeExperience(id)}
                      />
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {rationale ? (
          <div className="rounded-md border border-border bg-surface-muted/40 px-3 py-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted">
              {t("generate.combine.suggestionRationale")}
            </p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-muted">{rationale}</p>
          </div>
        ) : null}
      </div>

      {viewExperience ? (
        <ExperienceDetailDialog
          experience={
            experienceById.get(viewExperience.id) ?? viewExperience
          }
          onClose={() => setViewExperience(null)}
        />
      ) : null}

      {!readOnly ? (
        <CombineExperiencePickerDrawer
          open={pickerOpen}
          onClose={() => setPickerOpen(false)}
          linkedExperienceIds={experienceIds}
          onSelect={addExperience}
        />
      ) : null}
    </div>
  );
}
