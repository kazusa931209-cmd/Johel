"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useT } from "@/components/app/LocaleProvider";
import { AddButton } from "@/components/shared/action-icon-buttons";
import { DRAWER_TRANSITION_MS, Drawer } from "@/components/shared/drawer";
import { matchesExperienceSearch } from "@/lib/experience-search";
import { usePce } from "@/lib/pce";

type CombineExperiencePickerDrawerProps = {
  open: boolean;
  onClose: () => void;
  linkedExperienceIds: string[];
  onSelect: (experienceId: string) => void;
};

export function CombineExperiencePickerDrawer({
  open,
  onClose,
  linkedExperienceIds,
  onSelect,
}: CombineExperiencePickerDrawerProps) {
  const t = useT();
  const { experiences, loading } = usePce();
  const [search, setSearch] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const firstLinkableRef = useRef<HTMLLIElement>(null);

  const linkedSet = useMemo(
    () => new Set(linkedExperienceIds),
    [linkedExperienceIds],
  );

  const filteredExperiences = useMemo(() => {
    const query = search.trim().toLowerCase();
    const sorted = [...experiences].sort((a, b) =>
      a.category.localeCompare(b.category),
    );
    if (!query) return sorted;
    return sorted.filter((item) => matchesExperienceSearch(item, query));
  }, [experiences, search]);

  const firstLinkableId = useMemo(() => {
    const match = filteredExperiences.find(
      (item) => !linkedSet.has(item.id),
    );
    return match?.id ?? null;
  }, [filteredExperiences, linkedSet]);

  useEffect(() => {
    if (!open) return;

    const timeout = window.setTimeout(() => {
      scrollRef.current?.scrollTo({ top: 0 });
      searchRef.current?.focus({ preventScroll: true });
    }, DRAWER_TRANSITION_MS);

    return () => window.clearTimeout(timeout);
  }, [open]);

  useEffect(() => {
    if (!open || !search.trim() || !firstLinkableId) return;

    const frame = window.requestAnimationFrame(() => {
      firstLinkableRef.current?.scrollIntoView({
        block: "nearest",
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth",
      });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [open, search, firstLinkableId]);

  function handleSelect(experienceId: string) {
    if (linkedSet.has(experienceId)) return;
    onSelect(experienceId);
    onClose();
    setSearch("");
  }

  return (
    <Drawer
      title={t("generate.combine.pickerTitle")}
      open={open}
      onClose={() => {
        onClose();
        setSearch("");
      }}
    >
      <div
        ref={scrollRef}
        className="min-h-0 flex-1 overflow-y-auto"
      >
        <div className="space-y-4 p-4">
          <input
            ref={searchRef}
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t("generate.combine.pickerSearchPlaceholder")}
            className="w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-sm outline-none focus:border-muted"
          />

          {loading ? (
            <p className="text-sm text-muted">{t("shared.detail.loading")}</p>
          ) : filteredExperiences.length < 1 ? (
            <p className="text-sm text-muted">{t("crud.experiences.notFound")}</p>
          ) : (
            <ul className="space-y-1">
              {filteredExperiences.map((experience) => {
                const alreadyLinked = linkedSet.has(experience.id);
                return (
                  <li
                    key={experience.id}
                    ref={
                      experience.id === firstLinkableId ? firstLinkableRef : undefined
                    }
                  >
                  <div className="flex items-center justify-between gap-2 rounded-md border border-border px-3 py-2">
                    <span
                      className={`min-w-0 flex-1 truncate text-sm ${
                        alreadyLinked ? "text-muted" : ""
                      }`}
                    >
                      {experience.category}
                    </span>
                    {alreadyLinked ? (
                      <span className="shrink-0 text-xs text-muted">
                        {t("generate.combine.alreadyLinked")}
                      </span>
                    ) : (
                      <AddButton
                        label={t("generate.combine.linkExperienceAria")}
                        onClick={() => handleSelect(experience.id)}
                      />
                    )}
                  </div>
                </li>
              );
              })}
            </ul>
          )}
        </div>
      </div>
    </Drawer>
  );
}
