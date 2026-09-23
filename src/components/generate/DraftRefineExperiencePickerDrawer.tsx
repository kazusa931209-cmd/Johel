"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useT } from "@/components/app/LocaleProvider";
import { ExperienceDetailDrawer } from "@/components/ExperienceDetailDialog";
import { ViewButton } from "@/components/shared/action-icon-buttons";
import { DRAWER_TRANSITION_MS, Drawer } from "@/components/shared/drawer";
import type { ExperienceDetail } from "@/lib/api";
import { formatThousandsSeparated } from "@/lib/helper";
import { matchesExperienceSearch } from "@/lib/experience-search";
import { usePce } from "@/lib/pce";

const MAX_SELECTION = 10;

const LINKED_ROW_CLASS = "bg-surface-muted";

type DraftRefineExperiencePickerDrawerProps = {
  open: boolean;
  onClose: () => void;
  linkedExperienceIds: string[];
  linkedExperienceCompanyById: ReadonlyMap<string, string>;
  selectedIds: string[];
  onSelectedIdsChange: (ids: string[]) => void;
};

export function DraftRefineExperiencePickerDrawer({
  open,
  onClose,
  linkedExperienceIds,
  linkedExperienceCompanyById,
  selectedIds,
  onSelectedIdsChange,
}: DraftRefineExperiencePickerDrawerProps) {
  const t = useT();
  const { experiences, loading } = usePce();
  const [search, setSearch] = useState("");
  const [viewExperience, setViewExperience] = useState<ExperienceDetail | null>(
    null,
  );
  const scrollRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const linkedSet = useMemo(
    () => new Set(linkedExperienceIds),
    [linkedExperienceIds],
  );

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  const filteredExperiences = useMemo(() => {
    const query = search.trim().toLowerCase();
    const sorted = [...experiences].sort((a, b) =>
      a.category.localeCompare(b.category),
    );
    if (!query) return sorted;
    return sorted.filter((item) => matchesExperienceSearch(item, query));
  }, [experiences, search]);

  useEffect(() => {
    if (open) return;
    setViewExperience(null);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const timeout = window.setTimeout(() => {
      scrollRef.current?.scrollTo({ top: 0 });
      searchRef.current?.focus({ preventScroll: true });
    }, DRAWER_TRANSITION_MS);

    return () => window.clearTimeout(timeout);
  }, [open]);

  function toggleExperience(experienceId: string) {
    if (selectedSet.has(experienceId)) {
      onSelectedIdsChange(selectedIds.filter((id) => id !== experienceId));
      return;
    }
    if (selectedIds.length >= MAX_SELECTION) {
      return;
    }
    onSelectedIdsChange([...selectedIds, experienceId]);
  }

  function closePicker() {
    onClose();
    setSearch("");
    setViewExperience(null);
  }

  const detailOpen = viewExperience != null;

  return (
    <>
      <Drawer
        title={t("generate.generateStep.refine.pickerTitle")}
        open={open}
        onClose={closePicker}
        closeOnEscape={!detailOpen}
        headerTrailing={
          <input
            ref={searchRef}
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t("generate.combine.pickerSearchPlaceholder")}
            className="w-120 rounded-md border border-border bg-background px-3 py-2 font-mono text-sm outline-none focus:border-muted"
          />
        }
        footer={
          <button
            type="button"
            onClick={closePicker}
            className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-fg hover:opacity-90 disabled:opacity-60"
          >
            {t("generate.generateStep.refine.pickerConfirm")}
          </button>
        }
      >
        <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto">
          <div className="space-y-4 p-4">
            {selectedIds.length >= MAX_SELECTION ? (
              <p className="text-xs text-muted">
                {t("generate.generateStep.refine.pickerMax", {
                  max: formatThousandsSeparated(MAX_SELECTION),
                })}
              </p>
            ) : null}

            {loading ? (
              <p className="text-sm text-muted">{t("shared.detail.loading")}</p>
            ) : filteredExperiences.length < 1 ? (
              <p className="text-sm text-muted">{t("crud.experiences.notFound")}</p>
            ) : (
              <ul className="space-y-1">
                {filteredExperiences.map((experience) => {
                  const checked = selectedSet.has(experience.id);
                  const linked = linkedSet.has(experience.id);
                  const atMax = selectedIds.length >= MAX_SELECTION && !checked;
                  const linkedCompanyLabel = linked
                    ? linkedExperienceCompanyById.get(experience.id)
                    : undefined;
                  const selectionBlocked = atMax && !checked;
                  return (
                    <li key={experience.id}>
                      <div
                        role="button"
                        tabIndex={selectionBlocked ? -1 : 0}
                        aria-pressed={checked}
                        aria-disabled={selectionBlocked}
                        className={`flex items-center gap-2 rounded-md border border-border px-3 py-2 ${
                          linked ? LINKED_ROW_CLASS : ""
                        } ${
                          selectionBlocked
                            ? "cursor-not-allowed opacity-60"
                            : "cursor-pointer"
                        }`}
                        onClick={() => {
                          if (selectionBlocked) return;
                          toggleExperience(experience.id);
                        }}
                        onKeyDown={(event) => {
                          if (event.key !== "Enter" && event.key !== " ") {
                            return;
                          }
                          event.preventDefault();
                          if (selectionBlocked) return;
                          toggleExperience(experience.id);
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          readOnly
                          tabIndex={-1}
                          aria-hidden
                          className="h-4 w-4 shrink-0 rounded border-border"
                        />
                        <p className="min-w-0 flex-1 truncate text-left text-sm">
                          {experience.category}
                        </p>
                        <div
                          className="flex shrink-0 cursor-default items-center gap-2"
                          onClick={(event) => event.stopPropagation()}
                          onKeyDown={(event) => event.stopPropagation()}
                        >
                          {linked ? (
                            <span className="max-w-[12rem] truncate text-xs text-muted">
                              {linkedCompanyLabel ??
                                t("generate.combine.alreadyLinked")}
                            </span>
                          ) : null}
                          <ViewButton
                            onClick={() => setViewExperience(experience)}
                          />
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </Drawer>

      <ExperienceDetailDrawer
        experience={viewExperience}
        open={detailOpen}
        onClose={() => setViewExperience(null)}
      />
    </>
  );
}
