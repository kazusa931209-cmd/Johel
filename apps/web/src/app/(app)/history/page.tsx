"use client";

import { FormEvent, Suspense, useCallback, useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useGenerateStatus } from "@/components/app/GenerateStatusProvider";
import { useT } from "@/components/app/LocaleProvider";
import { useToast } from "@/components/app/ToastProvider";
import { GenerationHistoryDrawer } from "@/components/generate/GenerationHistoryDrawer";
import { HistoryStepsCell } from "@/components/generate/HistoryStepsCell";
import { TABLE_ROW_HOVER_CLASS } from "@/components/shared/detail-dialog";
import { listGenerations, type GenerationListItem } from "@/lib/api";
import { useCrudListParams } from "@/lib/crud-list-params";
import { formatThousandsSeparated } from "@/lib/helper";
import { formatTokenUsed } from "@/lib/tokens";

function HistoryPageFallback() {
  const t = useT();
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">
        {t("history.list.title")}
      </h1>
      <p className="text-sm text-muted">{t("crud.common.loading")}</p>
    </section>
  );
}

export default function HistoryPage() {
  return (
    <Suspense fallback={<HistoryPageFallback />}>
      <HistoryPageContent />
    </Suspense>
  );
}

function formatUpdatedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function HistoryPageContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const t = useT();
  const { toast } = useToast();
  const { status: generateStatus } = useGenerateStatus();
  const { page, q, setPage, applySearch } = useCrudListParams();
  const [qInput, setQInput] = useState(q);
  const [items, setItems] = useState<GenerationListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(true);

  const [selectedPublicId, setSelectedPublicId] = useState<string | null>(
    () => searchParams.get("publicId"),
  );
  const drawerOpen = Boolean(selectedPublicId);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  useEffect(() => {
    setQInput(q);
  }, [q]);

  const load = useCallback(
    async (nextQ: string, nextPage: number, options?: { silent?: boolean }) => {
      if (!options?.silent) {
        setLoading(true);
      }
      const res = await listGenerations(nextQ, nextPage);
      setLoading(false);
      if (res.error || !res.data) {
        toast(res.error ?? t("toast.generationHistoryLoadFailed"), "error");
        return;
      }
      setItems(res.data.items);
      setTotal(res.data.total);
      setPageSize(res.data.pageSize);
      if (res.data.page !== nextPage) {
        setPage(res.data.page);
      }
    },
    [setPage, t, toast],
  );

  useEffect(() => {
    void load(q, page);
    // Reload only when list filters change — not when drawer opens/closes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, page]);

  function onFilter(e: FormEvent) {
    e.preventDefault();
    applySearch(qInput.trim());
  }

  function openDetail(publicId: string) {
    setSelectedPublicId(publicId);
  }

  function closeDetail() {
    setSelectedPublicId(null);
    if (searchParams.get("publicId")) {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("publicId");
      const qs = params.toString();
      window.history.replaceState(
        null,
        "",
        qs ? `${pathname}?${qs}` : pathname,
      );
    }
  }

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">
        {t("history.list.title")}
      </h1>
      <form onSubmit={onFilter} className="flex items-center gap-2">
        <input
          type="search"
          value={qInput}
          onChange={(e) => setQInput(e.target.value)}
          placeholder={t("history.list.searchPlaceholder")}
          className="min-w-0 flex-1 rounded-md border border-border bg-background px-3 py-2 font-mono text-sm outline-none focus:border-muted"
        />
        <button
          type="submit"
          className="rounded-md border border-border px-3 py-2 text-sm hover:bg-surface-muted"
        >
          {t("crud.common.search")}
        </button>
      </form>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-120 text-left text-sm">
          <thead className="border-b border-border bg-surface-muted text-muted">
            <tr>
              <th className="px-3 py-2 font-medium">
                {t("history.list.columns.current")}
              </th>
              <th className="px-3 py-2 font-medium">
                {t("history.list.columns.generationId")}
              </th>
              <th className="px-3 py-2 font-medium">
                {t("history.list.columns.tokenUsed")}
              </th>
              <th className="px-3 py-2 font-medium">
                {t("history.list.columns.step")}
              </th>
              <th className="px-3 py-2 font-medium">
                {t("history.list.columns.updatedAt")}
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-3 py-8 text-center text-muted">
                  {t("crud.common.loading")}
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-8 text-center text-muted">
                  {t("history.list.empty")}
                </td>
              </tr>
            ) : (
              items.map((row) => (
                <tr
                  key={row.id}
                  className={TABLE_ROW_HOVER_CLASS}
                  tabIndex={0}
                  onClick={() => openDetail(row.publicId)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      openDetail(row.publicId);
                    }
                  }}
                >
                  <td className="px-3 py-2">
                    {row.publicId === generateStatus.generationPublicId ? (
                      <span
                        className="inline-flex rounded-full border border-foreground px-2 py-0.5 text-xs font-medium"
                        title={t("history.list.currentMark")}
                      >
                        {t("history.list.currentMark")}
                      </span>
                    ) : null}
                  </td>
                  <td className="px-3 py-2 font-medium">{row.publicId}</td>
                  <td className="px-3 py-2 text-muted">
                    {formatTokenUsed(row.tokenUsed)}
                  </td>
                  <td className="px-3 py-2">
                    <HistoryStepsCell
                      processedStep={row.processedStep}
                      doVerdict={row.doVerdict}
                      doEvaluate={row.doEvaluate}
                      finalized={row.finalized}
                    />
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-muted">
                    {formatUpdatedAt(row.updatedAt)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-end gap-2 text-sm text-muted">
        <span>
          {t("crud.common.pageOf", {
            page: formatThousandsSeparated(page),
            totalPages: formatThousandsSeparated(totalPages),
          })}
        </span>
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => setPage(page - 1)}
          className="rounded-md border border-border px-2 py-1 disabled:opacity-40"
        >
          {t("crud.common.prev")}
        </button>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => setPage(page + 1)}
          className="rounded-md border border-border px-2 py-1 disabled:opacity-40"
        >
          {t("crud.common.next")}
        </button>
      </div>

      <GenerationHistoryDrawer
        publicId={selectedPublicId}
        open={drawerOpen}
        onClose={closeDetail}
        onDetailUpdated={() => void load(q, page, { silent: true })}
      />
    </section>
  );
}
