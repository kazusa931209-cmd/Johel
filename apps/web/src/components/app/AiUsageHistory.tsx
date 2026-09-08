"use client";

import { useCallback, useEffect, useState } from "react";
import { useLocale, useT } from "@/components/app/LocaleProvider";
import { useToast } from "@/components/app/ToastProvider";
import { AiVerdictMarkdown } from "@/components/shared/AiVerdictMarkdown";
import { CopyButton } from "@/components/shared/action-icon-buttons";
import { Drawer } from "@/components/shared/drawer";
import { TABLE_ROW_HOVER_CLASS } from "@/components/shared/detail-dialog";
import { HistoryIcon } from "@/components/shared/icons";
import {
  formatAiProvider,
  formatAiUsageDate,
  formatGenerateType,
} from "@/lib/ai-usage";
import {
  getAiUsage,
  listAiUsage,
  type AiUsageDetail,
  type AiUsageListItem,
} from "@/lib/api";
import { copyTextToClipboard } from "@/lib/copy-to-clipboard";
import { STUDIO_FAB_CLASS } from "@/components/app/studio-fab";

type AiUsageHistoryProps = {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  showFab?: boolean;
};

type AiUsageDetailTab = "input" | "output";

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

function AiUsageHistoryDrawer({
  open,
  items,
  page,
  pageSize,
  totalPages,
  loading,
  onClose,
  onPageChange,
  onRowClick,
  closeOnEscape,
}: {
  open: boolean;
  items: AiUsageListItem[];
  page: number;
  pageSize: number;
  totalPages: number;
  loading: boolean;
  onClose: () => void;
  onPageChange: (page: number) => void;
  onRowClick: (id: string) => void;
  closeOnEscape: boolean;
}) {
  const t = useT();
  const { locale } = useLocale();

  return (
    <Drawer
      title={t("aiUsage.historyTitle")}
      open={open}
      onClose={onClose}
      zIndex={50}
      closeOnEscape={closeOnEscape}
    >
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 overflow-auto">
          <table className="w-full min-w-240 text-left text-sm">
            <thead className="sticky top-0 z-10 border-b border-border bg-surface-muted text-muted">
              <tr>
                <th className="px-3 py-2 font-medium">{t("aiUsage.columns.no")}</th>
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
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-3 py-8 text-center text-muted">
                    {t("aiUsage.loading")}
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-3 py-8 text-center text-muted">
                    {t("aiUsage.empty")}
                  </td>
                </tr>
              ) : (
                items.map((row, index) => (
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
                      {(page - 1) * pageSize + index + 1}
                    </td>
                    <td className="px-3 py-2">
                      {formatAiProvider(row.aiProvider, locale)}
                    </td>
                    <td className="px-3 py-2 text-muted">{row.modelName}</td>
                    <td className="px-3 py-2">
                      {formatGenerateType(row.generateType, locale)}
                    </td>
                    <td className="px-3 py-2 tabular-nums">{row.inputToken}</td>
                    <td className="px-3 py-2 tabular-nums">{row.outputToken}</td>
                    <td className="px-3 py-2 text-muted">
                      {formatAiUsageDate(row.createdAt, locale)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-border px-4 py-3 text-sm text-muted">
          <span>
            {t("crud.common.pageOf", { page, totalPages })}
          </span>
          <button
            type="button"
            disabled={page <= 1 || loading}
            onClick={() => onPageChange(Math.max(1, page - 1))}
            className="rounded-md border border-border px-2 py-1 disabled:opacity-40"
          >
            {t("crud.common.prev")}
          </button>
          <button
            type="button"
            disabled={page >= totalPages || loading}
            onClick={() => onPageChange(page + 1)}
            className="rounded-md border border-border px-2 py-1 disabled:opacity-40"
          >
            {t("crud.common.next")}
          </button>
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
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<AiUsageListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(100);
  const [loading, setLoading] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [detail, setDetail] = useState<AiUsageDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const detailOpen = detailLoading || detail != null;

  const loadList = useCallback(
    async (nextPage: number) => {
      setLoading(true);
      const res = await listAiUsage(nextPage);
      setLoading(false);
      if (res.error || !res.data) {
        toast(res.error ?? t("toast.historyLoadFailed"), "error");
        return;
      }
      setItems(res.data.items);
      setTotal(res.data.total);
      setPageSize(res.data.pageSize);
      setPage(res.data.page);
    },
    [t, toast],
  );

  useEffect(() => {
    if (!historyOpen) return;
    void loadList(page);
  }, [historyOpen, page, loadList]);

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
        items={items}
        page={page}
        pageSize={pageSize}
        totalPages={totalPages}
        loading={loading}
        onClose={closeHistory}
        onPageChange={setPage}
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
