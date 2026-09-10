"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AiUsageDetailDrawer } from "@/components/app/ai-usage/AiUsageDetailDrawer";
import { AiUsageGroupsList } from "@/components/app/ai-usage/AiUsageGroupsList";
import { AiUsageItemsTable } from "@/components/app/ai-usage/AiUsageItemsTable";
import { useT } from "@/components/app/LocaleProvider";
import { useToast } from "@/components/app/ToastProvider";
import { STUDIO_FAB_CLASS } from "@/components/app/studio-fab";
import { Drawer } from "@/components/shared/drawer";
import { HistoryIcon } from "@/components/shared/icons";
import {
  buildAiUsageGroupKey,
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
import { formatThousandsSeparated } from "@/lib/helper";

export type AiUsageHistoryTab = "all" | "generation" | "other";

type AiUsageHistoryProps = {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  showFab?: boolean;
};

const AI_USAGE_HISTORY_DRAWER_WIDTH = "w-[min(80rem,92vw)]";

const HISTORY_TABS: { id: AiUsageHistoryTab; labelKey: string }[] = [
  { id: "all", labelKey: "aiUsage.historyTabs.all" },
  { id: "generation", labelKey: "aiUsage.historyTabs.generation" },
  { id: "other", labelKey: "aiUsage.historyTabs.other" },
];

function AiUsageHistoryDrawer({
  open,
  tab,
  items,
  groups,
  page,
  pageSize,
  totalPages,
  loading,
  expandedGroups,
  groupItems,
  groupItemsLoading,
  onClose,
  onTabChange,
  onPageChange,
  onToggleGroup,
  onRowClick,
  closeOnEscape,
}: {
  open: boolean;
  tab: AiUsageHistoryTab;
  items: AiUsageListItem[];
  groups: AiUsageGroupItem[];
  page: number;
  pageSize: number;
  totalPages: number;
  loading: boolean;
  expandedGroups: Set<string>;
  groupItems: Record<string, AiUsageListItem[]>;
  groupItemsLoading: Record<string, boolean>;
  onClose: () => void;
  onTabChange: (tab: AiUsageHistoryTab) => void;
  onPageChange: (page: number) => void;
  onToggleGroup: (group: AiUsageGroupItem) => void;
  onRowClick: (id: string) => void;
  closeOnEscape: boolean;
}) {
  const t = useT();
  const unassignedLabel = t("aiUsage.groups.unassigned");
  const isEmpty =
    tab === "generation" ? groups.length === 0 : items.length === 0;

  return (
    <Drawer
      title={t("aiUsage.historyTitle")}
      open={open}
      onClose={onClose}
      widthClass={AI_USAGE_HISTORY_DRAWER_WIDTH}
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
      <div className="flex h-full min-h-0 flex-col overflow-hidden">
        <div
          className="flex shrink-0 gap-1 border-b border-border px-4 pt-2"
          role="tablist"
          aria-label={t("aiUsage.historyTabsAria")}
        >
          {HISTORY_TABS.map((item) => {
            const selected = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                id={`ai-usage-history-tab-${item.id}`}
                aria-selected={selected}
                aria-controls="ai-usage-history-panel"
                className={[
                  "rounded-t-md px-3 py-2 text-sm font-medium transition-colors",
                  selected
                    ? "border border-b-0 border-border bg-surface text-foreground"
                    : "text-muted hover:text-foreground",
                ].join(" ")}
                onClick={() => onTabChange(item.id)}
              >
                {t(item.labelKey)}
              </button>
            );
          })}
        </div>
        <div
          id="ai-usage-history-panel"
          role="tabpanel"
          aria-labelledby={`ai-usage-history-tab-${tab}`}
          className="min-h-0 flex-1 overflow-auto"
        >
          {loading ? (
            <p className="px-4 py-8 text-center text-sm text-muted">
              {t("aiUsage.loading")}
            </p>
          ) : isEmpty ? (
            <p className="px-4 py-8 text-center text-sm text-muted">
              {t("aiUsage.empty")}
            </p>
          ) : tab === "generation" ? (
            <AiUsageGroupsList
              groups={groups}
              expandedGroups={expandedGroups}
              groupItems={groupItems}
              groupItemsLoading={groupItemsLoading}
              unassignedLabel={unassignedLabel}
              onToggleGroup={onToggleGroup}
              onRowClick={onRowClick}
            />
          ) : (
            <div className="overflow-x-auto">
              <AiUsageItemsTable
                items={items}
                startNo={(page - 1) * pageSize}
                showGenerationIdColumn={tab !== "other"}
                onRowClick={onRowClick}
              />
            </div>
          )}
        </div>
      </div>
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
  const [tab, setTab] = useState<AiUsageHistoryTab>("all");
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<AiUsageListItem[]>([]);
  const [groups, setGroups] = useState<AiUsageGroupItem[]>([]);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(100);
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
  const listRequestId = useRef(0);

  const totalPages = Math.max(1, Math.ceil(total / pageSize) || 1);
  const detailOpen = detailLoading || detail != null;

  const applyListMeta = useCallback(
    (data: { total: number; page: number; pageSize: number }) => {
      setTotal(data.total);
      setPageSize(data.pageSize);
      setPage(data.page);
      setExpandedGroups(new Set());
      setGroupItems({});
      setGroupItemsLoading({});
    },
    [],
  );

  const loadList = useCallback(
    async (nextPage: number, nextTab: AiUsageHistoryTab) => {
      const requestId = ++listRequestId.current;
      setLoading(true);
      if (nextTab === "generation") {
        const res = await listAiUsageGroups(nextPage);
        if (requestId !== listRequestId.current) return;
        setLoading(false);
        if (res.error || !res.data) {
          toast(res.error ?? t("toast.historyLoadFailed"), "error");
          return;
        }
        setGroups(sortAiUsageGroupsByLatest(res.data.items));
        setItems([]);
        applyListMeta(res.data);
        return;
      }

      const res = await listAiUsage(
        nextPage,
        nextTab === "other" ? { generationId: null } : undefined,
      );
      if (requestId !== listRequestId.current) return;
      setLoading(false);
      if (res.error || !res.data) {
        toast(res.error ?? t("toast.historyLoadFailed"), "error");
        return;
      }
      setItems(sortAiUsageItemsByCreatedAt(res.data.items));
      setGroups([]);
      applyListMeta(res.data);
    },
    [applyListMeta, t, toast],
  );

  const loadGroupItems = useCallback(
    async (group: AiUsageGroupItem) => {
      const key = buildAiUsageGroupKey(group);
      setGroupItemsLoading((current) => ({ ...current, [key]: true }));
      const res = await listAiUsage(1, {
        generationId: group.generationId,
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
    void loadList(page, tab);
  }, [historyOpen, page, tab, loadList]);

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

  function onTabChange(nextTab: AiUsageHistoryTab) {
    if (nextTab === tab) return;
    setTab(nextTab);
    setPage(1);
    setTotal(0);
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
        tab={tab}
        items={items}
        groups={groups}
        page={page}
        pageSize={pageSize}
        totalPages={totalPages}
        loading={loading}
        expandedGroups={expandedGroups}
        groupItems={groupItems}
        groupItemsLoading={groupItemsLoading}
        onClose={closeHistory}
        onTabChange={onTabChange}
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
