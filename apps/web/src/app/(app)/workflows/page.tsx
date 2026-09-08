"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useT } from "@/components/app/LocaleProvider";
import { useToast } from "@/components/app/ToastProvider";
import {
  AddButton,
  DeleteButton,
  EditButton,
} from "@/components/shared/action-icon-buttons";
import {
  DetailDialog,
  TABLE_ROW_HOVER_CLASS,
} from "@/components/shared/detail-dialog";
import { WorkflowDetailDialog } from "@/components/WorkflowDetailDialog";
import { deleteWorkflow, listWorkflows, type Workflow } from "@/lib/api";

function formatDate(iso: string) {
  return new Date(iso).toLocaleString();
}

export default function WorkflowsPage() {
  const router = useRouter();
  const t = useT();
  const { toast } = useToast();
  const [qInput, setQInput] = useState("");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<Workflow[]>([]);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<Workflow | null>(null);
  const [deletingBusy, setDeletingBusy] = useState(false);
  const [viewingId, setViewingId] = useState<string | null>(null);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const load = useCallback(
    async (nextQ: string, nextPage: number) => {
      setLoading(true);
      const res = await listWorkflows(nextQ, nextPage);
      setLoading(false);
      if (res.error || !res.data) {
        toast(res.error ?? t("toast.workflowsLoadFailed"), "error");
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
    void load(q, page);
  }, [load, q, page]);

  async function onConfirmDelete() {
    if (!deleting) return;
    setDeletingBusy(true);
    const res = await deleteWorkflow(deleting.id);
    setDeletingBusy(false);
    if (res.error) {
      toast(res.error, "error");
      return;
    }
    setDeleting(null);
    toast(t("toast.workflowDeleted"), "success");
    const nextPage = items.length === 1 && page > 1 ? page - 1 : page;
    void load(q, nextPage);
  }

  function onFilter(e: FormEvent) {
    e.preventDefault();
    setPage(1);
    setQ(qInput.trim());
  }

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">
        {t("crud.workflows.title")}
      </h1>
      <form onSubmit={onFilter} className="flex items-center gap-2">
        <input
          type="search"
          value={qInput}
          onChange={(e) => setQInput(e.target.value)}
          placeholder={t("crud.workflows.searchPlaceholder")}
          className="min-w-0 flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-muted"
        />
        <button
          type="submit"
          className="rounded-md border border-border px-3 py-2 text-sm hover:bg-surface-muted"
        >
          {t("crud.common.search")}
        </button>
        <AddButton
          onClick={() => router.push("/workflows/new")}
          className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-accent text-accent-fg hover:opacity-90"
        />
      </form>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-border bg-surface-muted text-muted">
            <tr>
              <th className="px-3 py-2 font-medium">{t("crud.common.no")}</th>
              <th className="px-3 py-2 font-medium">
                {t("crud.workflows.columns.name")}
              </th>
              <th className="px-3 py-2 font-medium">
                {t("crud.workflows.columns.description")}
              </th>
              <th className="px-3 py-2 font-medium">
                {t("crud.workflows.columns.updated")}
              </th>
              <th className="px-3 py-2 font-medium" />
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
                  {t("crud.workflows.empty")}
                </td>
              </tr>
            ) : (
              items.map((row, index) => (
                <tr
                  key={row.id}
                  className={TABLE_ROW_HOVER_CLASS}
                  tabIndex={0}
                  onClick={() => setViewingId(row.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setViewingId(row.id);
                    }
                  }}
                >
                  <td className="px-3 py-2 text-muted">
                    {(page - 1) * pageSize + index + 1}
                  </td>
                  <td className="px-3 py-2 font-medium">{row.name}</td>
                  <td className="max-w-[220px] truncate px-3 py-2 text-muted">
                    {row.description ?? ""}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-muted">
                    {formatDate(row.updatedAt)}
                  </td>
                  <td
                    className="cursor-default px-3 py-2"
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
                  >
                    <div className="flex justify-end gap-2">
                      <EditButton
                        onClick={() =>
                          router.push(`/workflows/${row.id}/edit`)
                        }
                      />
                      <DeleteButton onClick={() => setDeleting(row)} />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-end gap-2 text-sm text-muted">
        <span>
          {t("crud.common.pageOf", { page, totalPages })}
        </span>
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          className="rounded-md border border-border px-2 py-1 disabled:opacity-40"
        >
          {t("crud.common.prev")}
        </button>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => setPage((p) => p + 1)}
          className="rounded-md border border-border px-2 py-1 disabled:opacity-40"
        >
          {t("crud.common.next")}
        </button>
      </div>

      {viewingId ? (
        <WorkflowDetailDialog
          workflowId={viewingId}
          onClose={() => setViewingId(null)}
        />
      ) : null}

      {deleting ? (
        <DetailDialog
          title={t("crud.workflows.delete.title")}
          role="alertdialog"
          closeDisabled={deletingBusy}
          onClose={() => setDeleting(null)}
        >
          <p className="text-muted">
            {t("crud.workflows.delete.body", { name: deleting.name })}
          </p>
          <div className="flex justify-end">
            <button
              type="button"
              disabled={deletingBusy}
              onClick={() => void onConfirmDelete()}
              className="rounded-md bg-toast-error-bg px-3 py-2 text-sm font-medium text-toast-error-fg disabled:opacity-60"
            >
              {deletingBusy
                ? t("crud.common.deleting")
                : t("crud.common.delete")}
            </button>
          </div>
        </DetailDialog>
      ) : null}
    </section>
  );
}
