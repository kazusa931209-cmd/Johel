"use client";

import { useCallback, useEffect, useState } from "react";
import { useLocale, useT } from "@/components/app/LocaleProvider";
import { useToast } from "@/components/app/ToastProvider";
import { AiVerdictMarkdown } from "@/components/shared/AiVerdictMarkdown";
import { CopyButton } from "@/components/shared/action-icon-buttons";
import { Drawer } from "@/components/shared/drawer";
import { TABLE_ROW_HOVER_CLASS } from "@/components/shared/detail-dialog";
import { ChevronRightIcon, HistoryIcon } from "@/components/shared/icons";
import {
  buildAiUsageGroupKey,
  formatAiProvider,
  formatAiUsageDate,
  formatGenerateType,
  formatStandaloneGroupLabel,
  sortAiUsageGroupsByLatest,
  sortAiUsageItemsByCreatedAt,
} from "@/lib/ai-usage";
import {
  getAiUsage,
  listAiUsage,
  listAiUsageGroups,
  type AiUsageDetail,
  type AiUsageGroupItem,
  type AiUsageListItem,
} from "@/lib/api";
import { copyTextToClipboard } from "@/lib/copy-to-clipboard";
import { formatThousandsSeparated } from "@/lib/helper";
import type { Locale } from "@/lib/locale";
import { STUDIO_FAB_CLASS } from "@/components/app/studio-fab";

type AiUsageHistoryProps = {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  showFab?: boolean;
};

type AiUsageDetailTab = "input" | "output";

function formatGroupLabel(
  group: AiUsageGroupItem,
  unassignedLabel: string,
  locale: Locale,
) {
  if (group.generationPublicId) {
    return group.generationPublicId;
  }
  if (group.standaloneDate && group.generateType) {
    return formatStandaloneGroupLabel(
      group.standaloneDate,
      group.generateType,
      locale,
    );
  }
  return unassignedLabel;
}

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
      <span className="truncate">{t("aiUsage.groups.columnGroup")}</span>
      <span className="text-right">{t("aiUsage.groups.columnCalls")}</span>
      <span className="text-right">{t("aiUsage.groups.columnInput")}</span>
      <span className="text-right">{t("aiUsage.groups.columnOutput")}</span>
      <span className="text-right">{t("aiUsage.groups.columnTotal")}</span>
    </div>
  );
}

function AiUsageDetailPanel({
  detail,
  onCopy,
}: {
  detail: AiUsageDetail;
  onCopy: (text: string) => void;
}) {
  const t = useT();
  const [activeTab, setActiveTab] = useState<AiUsageDetailTab>("input");

  const detailTabs: { id: AiUsageDetailTab; label: string }[] = [
    { id: "input", label: t("aiUsage.input") },
    { id: "output", label: t("aiUsage.output") },
  ];

  useEffect(() => {
    setActiveTab("input");
  }, [detail.id]);

  const rawText = activeTab === "input" ? detail.input : detail.output;
  const tabPanelId = `ai-usage-detail-${activeTab}`;

  return (
    <section
      className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-border bg-background text-sm"
      aria-label={t("aiUsage.detailContentAria")}
    >
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border bg-surface-muted px-3 py-2">
        <div className="flex gap-1" role="tablist" aria-label={t("aiUsage.tabsAria")}>
          {detailTabs.map((tab) => {
            const selected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                id={`ai-usage-detail-tab-${tab.id}`}
                aria-selected={selected}
                aria-controls={tabPanelId}
                className={[
                  "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  selected
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted hover:text-foreground",
                ].join(" ")}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
        <CopyButton
          disabled={!rawText.trim()}
          onClick={() => onCopy(rawText)}
        />
      </div>
      <div
        id={tabPanelId}
        role="tabpanel"
        aria-labelledby={`ai-usage-detail-tab-${activeTab}`}
        className="min-h-0 flex-1 overflow-auto p-3"
      >
        {rawText.trim() ? (
          <AiVerdictMarkdown markdown={rawText} />
        ) : (
          <p className="text-sm text-muted">{t("crud.common.emDash")}</p>
        )}
      </div>
    </section>
  );
}

function AiUsageDetailDrawer({
  detail,
  loading,
  onClose,
}: {
  detail: AiUsageDetail | null;
  loading: boolean;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const t = useT();
  const open = loading || detail != null;

  async function handleCopy(text: string) {
    const ok = await copyTextToClipboard(text);
    if (ok) {
      toast(t("toast.copied"), "success");
    } else {
      toast(t("toast.copyFailed"), "error");
    }
  }

  return (
    <Drawer
      title={t("aiUsage.detailTitle")}
      open={open}
      onClose={onClose}
      widthClass="w-[min(56rem,85vw)]"
      zIndex={60}
      closeOnEscape
    >
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-4">
        {loading ? (
          <p className="text-sm text-muted">{t("aiUsage.loading")}</p>
        ) : detail ? (
          <AiUsageDetailPanel
            detail={detail}
            onCopy={(text) => void handleCopy(text)}
          />
        ) : null}
      </div>
    </Drawer>
  );
}

function AiUsageItemsTable({
  items,
  unassignedLabel,
  onRowClick,
}: {
  items: AiUsageListItem[];
  unassignedLabel: string;
  onRowClick: (id: string) => void;
}) {
  const t = useT();
  const { locale } = useLocale();

  return (
    <table className="w-full min-w-240 text-left text-sm">
      <thead className="border-b border-border bg-background text-muted">
        <tr>
          <th className="px-3 py-2 font-medium">{t("aiUsage.columns.no")}</th>
          <th className="px-3 py-2 font-medium">
            {t("aiUsage.columns.generationId")}
          </th>
          <th className="px-3 py-2 font-medium">{t("aiUsage.columns.ai")}</th>
          <th className="px-3 py-2 font-medium">{t("aiUsage.columns.model")}</th>
          <th className="px-3 py-2 font-medium">
            {t("aiUsage.columns.generateType")}
          </th>
          <th className="px-3 py-2 font-medium">
            {t("aiUsage.columns.inputToken")}
          </th>
          <th className="px-3 py-2 font-medium">
            {t("aiUsage.columns.outputToken")}
          </th>
          <th className="px-3 py-2 font-medium">
            {t("aiUsage.columns.createdAt")}
          </th>
        </tr>
      </thead>
      <tbody>
        {items.map((row, index) => (
          <tr
            key={row.id}
            className={TABLE_ROW_HOVER_CLASS}
            tabIndex={0}
            onClick={() => onRowClick(row.id)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onRowClick(row.id);
              }
            }}
          >
            <td className="px-3 py-2 text-muted">
              {formatThousandsSeparated(index + 1)}
            </td>
            <td className="px-3 py-2 text-muted">
              {row.generationPublicId ?? unassignedLabel}
            </td>
            <td className="px-3 py-2">
              {formatAiProvider(row.aiProvider, locale)}
            </td>
            <td className="px-3 py-2 text-muted">{row.modelName}</td>
            <td className="px-3 py-2">
              {formatGenerateType(row.generateType, locale)}
            </td>
            <td className="px-3 py-2 tabular-nums">
              {formatThousandsSeparated(row.inputToken)}
            </td>
            <td className="px-3 py-2 tabular-nums">
              {formatThousandsSeparated(row.outputToken)}
            </td>
            <td className="px-3 py-2 text-muted">
              {formatAiUsageDate(row.createdAt, locale)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function AiUsageHistoryDrawer({
  open,
  groups,
  page,
  pageSize,
  totalPages,
  loading,
  expandedGroups,
  groupItems,
  groupItemsLoading,
  onClose,
  onPageChange,
  onToggleGroup,
  onRowClick,
  closeOnEscape,
}: {
  open: boolean;
  groups: AiUsageGroupItem[];
  page: number;
  pageSize: number;
  totalPages: number;
  loading: boolean;
  expandedGroups: Set<string>;
  groupItems: Record<string, AiUsageListItem[]>;
  groupItemsLoading: Record<string, boolean>;
  onClose: () => void;
  onPageChange: (page: number) => void;
  onToggleGroup: (group: AiUsageGroupItem) => void;
  onRowClick: (id: string) => void;
  closeOnEscape: boolean;
}) {
  const t = useT();
  const { locale } = useLocale();
  const unassignedLabel = t("aiUsage.groups.unassigned");

  return (
    <Drawer
      title={t("aiUsage.historyTitle")}
      open={open}
      onClose={onClose}
      zIndex={50}
      closeOnEscape={closeOnEscape}
      footer={
        <>
          <span className="text-sm text-muted">
            {t("crud.common.pageOf", {
              page: formatThousandsSeparated(page),
              totalPages: formatThousandsSeparated(totalPages),
            })}
          </span>
          <button
            type="button"
            disabled={page <= 1 || loading}
            onClick={() => onPageChange(Math.max(1, page - 1))}
            className="rounded-md border border-border px-2 py-1 text-sm disabled:opacity-40"
          >
            {t("crud.common.prev")}
          </button>
          <button
            type="button"
            disabled={page >= totalPages || loading}
            onClick={() => onPageChange(page + 1)}
            className="rounded-md border border-border px-2 py-1 text-sm disabled:opacity-40"
          >
            {t("crud.common.next")}
          </button>
        </>
      }
    >
      {loading ? (
        <p className="px-4 py-8 text-center text-sm text-muted">
          {t("aiUsage.loading")}
        </p>
      ) : groups.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-muted">
          {t("aiUsage.empty")}
        </p>
      ) : (
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
                  <span className="min-w-0 truncate font-medium">
                    {formatGroupLabel(group, unassignedLabel, locale)}
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
                        unassignedLabel={unassignedLabel}
                        onRowClick={onRowClick}
                      />
                    )}
                  </div>
                ) : null}
              </section>
            );
          })}
        </div>
      )}
    </Drawer>
  );
}

export function AiUsageHistory({
  open: controlledOpen,
  onOpenChange,
  showFab = true,
}: AiUsageHistoryProps = {}) {
  const { toast } = useToast();
  const t = useT();
  const [internalOpen, setInternalOpen] = useState(false);
  const historyOpen = controlledOpen ?? internalOpen;
  const setHistoryOpen = onOpenChange ?? setInternalOpen;
  const [page, setPage] = useState(1);
  const [groups, setGroups] = useState<AiUsageGroupItem[]>([]);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(50);
  const [loading, setLoading] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [groupItems, setGroupItems] = useState<Record<string, AiUsageListItem[]>>(
    {},
  );
  const [groupItemsLoading, setGroupItemsLoading] = useState<
    Record<string, boolean>
  >({});
  const [detailId, setDetailId] = useState<string | null>(null);
  const [detail, setDetail] = useState<AiUsageDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const detailOpen = detailLoading || detail != null;

  const loadGroups = useCallback(
    async (nextPage: number) => {
      setLoading(true);
      const res = await listAiUsageGroups(nextPage);
      setLoading(false);
      if (res.error || !res.data) {
        toast(res.error ?? t("toast.historyLoadFailed"), "error");
        return;
      }
      setGroups(sortAiUsageGroupsByLatest(res.data.items));
      setTotal(res.data.total);
      setPageSize(res.data.pageSize);
      setPage(res.data.page);
      setExpandedGroups(new Set());
      setGroupItems({});
      setGroupItemsLoading({});
    },
    [t, toast],
  );

  const loadGroupItems = useCallback(
    async (group: AiUsageGroupItem) => {
      const key = buildAiUsageGroupKey(group);
      setGroupItemsLoading((current) => ({ ...current, [key]: true }));
      const res = await listAiUsage(1, {
        generationId: group.generationId,
        standaloneDate: group.standaloneDate,
        generateType: group.generateType,
        limit: null,
      });
      setGroupItemsLoading((current) => ({ ...current, [key]: false }));
      if (res.error || !res.data) {
        toast(res.error ?? t("toast.historyLoadFailed"), "error");
        return;
      }
      setGroupItems((current) => ({
        ...current,
        [key]: sortAiUsageItemsByCreatedAt(res.data!.items),
      }));
    },
    [t, toast],
  );

  useEffect(() => {
    if (!historyOpen) return;
    void loadGroups(page);
  }, [historyOpen, page, loadGroups]);

  function openHistory() {
    setDetailId(null);
    setDetail(null);
    setPage(1);
    setHistoryOpen(true);
  }

  function closeHistory() {
    setHistoryOpen(false);
    setDetailId(null);
    setDetail(null);
  }

  function closeDetail() {
    setDetailId(null);
    setDetail(null);
  }

  async function onToggleGroup(group: AiUsageGroupItem) {
    const key = buildAiUsageGroupKey(group);
    if (expandedGroups.has(key)) {
      setExpandedGroups((current) => {
        const next = new Set(current);
        next.delete(key);
        return next;
      });
      return;
    }

    if (!groupItems[key]) {
      await loadGroupItems(group);
    }

    setExpandedGroups((current) => new Set(current).add(key));
  }

  async function onRowClick(id: string) {
    setDetailId(id);
    setDetail(null);
    setDetailLoading(true);
    const res = await getAiUsage(id);
    setDetailLoading(false);
    if (res.error || !res.data) {
      setDetailId(null);
      toast(res.error ?? t("toast.detailLoadFailed"), "error");
      return;
    }
    setDetail(res.data);
  }

  return (
    <>
      {showFab ? (
        <button
          type="button"
          aria-label={t("aiUsage.fabAria")}
          className={STUDIO_FAB_CLASS}
          onClick={openHistory}
        >
          <HistoryIcon className="h-6 w-6" />
        </button>
      ) : null}

      <AiUsageHistoryDrawer
        open={historyOpen}
        groups={groups}
        page={page}
        pageSize={pageSize}
        totalPages={totalPages}
        loading={loading}
        expandedGroups={expandedGroups}
        groupItems={groupItems}
        groupItemsLoading={groupItemsLoading}
        onClose={closeHistory}
        onPageChange={setPage}
        onToggleGroup={(group) => void onToggleGroup(group)}
        onRowClick={(id) => void onRowClick(id)}
        closeOnEscape={!detailOpen}
      />

      <AiUsageDetailDrawer
        detail={detail}
        loading={detailLoading && detailId != null}
        onClose={closeDetail}
      />
    </>
  );
}
