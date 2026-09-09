"use client";

import { FormEvent, Suspense, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useT } from "@/components/app/LocaleProvider";
import { useToast } from "@/components/app/ToastProvider";
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

function formatCreatedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function HistoryPageContent() {
  const router = useRouter();
  const t = useT();
  const { toast } = useToast();
  const { page, q, setPage, applySearch } = useCrudListParams();
  const [qInput, setQInput] = useState(q);
  const [items, setItems] = useState<GenerationListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(true);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  useEffect(() => {
    setQInput(q);
  }, [q]);

  const load = useCallback(
    async (nextQ: string, nextPage: number) => {
      setLoading(true);
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
  }, [load, q, page]);

  function onFilter(e: FormEvent) {
    e.preventDefault();
    applySearch(qInput.trim());
  }

  function statusLabel(status: GenerationListItem["status"]) {
    return status === "completed"
      ? t("history.status.completed")
      : t("history.status.inProgress");
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
                {t("history.list.columns.generationId")}
              </th>
              <th className="px-3 py-2 font-medium">
                {t("history.list.columns.tokenUsed")}
              </th>
              <th className="px-3 py-2 font-medium">
                {t("history.list.columns.createdAt")}
              </th>
              <th className="px-3 py-2 font-medium">
                {t("history.list.columns.status")}
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="px-3 py-8 text-center text-muted">
                  {t("crud.common.loading")}
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-3 py-8 text-center text-muted">
                  {t("history.list.empty")}
                </td>
              </tr>
            ) : (
              items.map((row) => (
                <tr
                  key={row.id}
                  className={TABLE_ROW_HOVER_CLASS}
                  tabIndex={0}
                  onClick={() => router.push(`/history/${row.publicId}`)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      router.push(`/history/${row.publicId}`);
                    }
                  }}
                >
                  <td className="px-3 py-2 font-medium">{row.publicId}</td>
                  <td className="px-3 py-2 text-muted">
                    {formatTokenUsed(row.tokenUsed)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-muted">
                    {formatCreatedAt(row.createdAt)}
                  </td>
                  <td className="px-3 py-2 text-muted">
                    {statusLabel(row.status)}
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
    </section>
  );
}
