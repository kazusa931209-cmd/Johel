"use client";

import { useT } from "@/components/app/LocaleProvider";
import { ChevronRightIcon } from "@/components/shared/icons";
import { AiUsageItemsTable } from "@/components/app/ai-usage/AiUsageItemsTable";
import { buildAiUsageGroupKey } from "@/lib/ai-usage";
import type { AiUsageGroupItem, AiUsageListItem } from "@/lib/api";
import { formatThousandsSeparated } from "@/lib/helper";

/** Shared grid for group header row and each group summary row. */
const AI_USAGE_GROUP_GRID_CLASS =
  "grid w-full grid-cols-[1.25rem_minmax(0,1fr)_5.5rem_5.5rem_5.5rem_5.5rem] items-center gap-x-3";

function AiUsageGroupListHeader() {
  const t = useT();

  return (
    <div
      className={`${AI_USAGE_GROUP_GRID_CLASS} border-b border-border bg-background px-4 py-2 text-xs font-medium text-muted`}
      aria-hidden
    >
      <span />
      <span className="truncate">{t("aiUsage.columns.generationId")}</span>
      <span className="text-right">{t("aiUsage.groups.columnCalls")}</span>
      <span className="text-right">{t("aiUsage.groups.columnInput")}</span>
      <span className="text-right">{t("aiUsage.groups.columnOutput")}</span>
      <span className="text-right">{t("aiUsage.groups.columnTotal")}</span>
    </div>
  );
}

export function AiUsageGroupsList({
  groups,
  expandedGroups,
  groupItems,
  groupItemsLoading,
  unassignedLabel,
  onToggleGroup,
  onRowClick,
}: {
  groups: AiUsageGroupItem[];
  expandedGroups: Set<string>;
  groupItems: Record<string, AiUsageListItem[]>;
  groupItemsLoading: Record<string, boolean>;
  unassignedLabel: string;
  onToggleGroup: (group: AiUsageGroupItem) => void;
  onRowClick: (id: string) => void;
}) {
  const t = useT();

  return (
    <div className="divide-y divide-border">
      <AiUsageGroupListHeader />
      {groups.map((group) => {
        const key = buildAiUsageGroupKey(group);
        const expanded = expandedGroups.has(key);
        const items = groupItems[key] ?? [];
        const itemsLoading = groupItemsLoading[key] ?? false;

        return (
          <section key={key}>
            <button
              type="button"
              aria-expanded={expanded}
              onClick={() => onToggleGroup(group)}
              className={`${AI_USAGE_GROUP_GRID_CLASS} px-4 py-3 text-left text-sm hover:bg-surface-muted`}
            >
              <ChevronRightIcon
                className={`h-4 w-4 shrink-0 text-muted transition-transform ${
                  expanded ? "rotate-90" : ""
                }`}
              />
              <span className="min-w-0 truncate font-mono font-medium">
                {group.generationPublicId ?? unassignedLabel}
              </span>
              <span className="text-right tabular-nums text-muted">
                {formatThousandsSeparated(group.callCount)}
              </span>
              <span className="text-right tabular-nums">
                {formatThousandsSeparated(group.inputToken)}
              </span>
              <span className="text-right tabular-nums">
                {formatThousandsSeparated(group.outputToken)}
              </span>
              <span className="text-right tabular-nums font-medium">
                {formatThousandsSeparated(group.tokenUsed)}
              </span>
            </button>
            {expanded ? (
              <div className="overflow-x-auto border-t border-border bg-surface-muted/40 px-2 pb-3">
                {itemsLoading ? (
                  <p className="px-3 py-4 text-sm text-muted">
                    {t("aiUsage.loading")}
                  </p>
                ) : items.length === 0 ? (
                  <p className="px-3 py-4 text-sm text-muted">
                    {t("aiUsage.empty")}
                  </p>
                ) : (
                  <AiUsageItemsTable
                    items={items}
                    onRowClick={onRowClick}
                  />
                )}
              </div>
            ) : null}
          </section>
        );
      })}
    </div>
  );
}
