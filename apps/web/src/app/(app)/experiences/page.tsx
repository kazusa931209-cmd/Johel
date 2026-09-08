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
import { ExperienceDetailDialog } from "@/components/ExperienceDetailDialog";
import {
  deleteExperience,
  listExperiences,
  type ExperienceDetail,
} from "@/lib/api";

export default function ExperiencesPage() {
  const router = useRouter();
  const t = useT();
  const { toast } = useToast();
  const [qInput, setQInput] = useState("");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<ExperienceDetail[]>([]);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<ExperienceDetail | null>(null);
  const [deletingBusy, setDeletingBusy] = useState(false);
  const [viewing, setViewing] = useState<ExperienceDetail | null>(null);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const load = useCallback(
    async (nextQ: string, nextPage: number) => {
      setLoading(true);
      const res = await listExperiences(nextQ, nextPage);
      setLoading(false);
      if (res.error || !res.data) {
        toast(res.error ?? t("toast.experiencesLoadFailed"), "error");
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
    const res = await deleteExperience(deleting.id);
    setDeletingBusy(false);
    if (res.error) {
      toast(res.error, "error");
      return;
    }
    setDeleting(null);
    toast(t("toast.experienceDeleted"), "success");
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
        {t("crud.experiences.title")}
      </h1>
      <form onSubmit={onFilter} className="flex items-center gap-2">
        <input
          type="search"
          value={qInput}
          onChange={(e) => setQInput(e.target.value)}
          placeholder={t("crud.experiences.searchPlaceholder")}
          className="min-w-0 flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-muted"
        />
        <button
          type="submit"
          className="rounded-md border border-border px-3 py-2 text-sm hover:bg-surface-muted"
        >
          {t("crud.common.search")}
        </button>
        <AddButton
          onClick={() => router.push("/experiences/new")}
          className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-accent text-accent-fg hover:opacity-90"
        />
      </form>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-60 text-left text-sm">
          <thead className="border-b border-border bg-surface-muted text-muted">
            <tr>
              <th className="px-3 py-2 font-medium">{t("crud.common.no")}</th>
              <th className="px-3 py-2 font-medium">
                {t("crud.experiences.columns.category")}
              </th>
              <th className="px-3 py-2 font-medium">
                {t("crud.experiences.columns.problem")}
              </th>
              <th className="px-3 py-2 font-medium">
                {t("crud.experiences.columns.actions")}
              </th>
              <th className="px-3 py-2 font-medium">
                {t("crud.experiences.columns.outcome")}
              </th>
              <th className="px-3 py-2 font-medium" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-muted">
                  {t("crud.common.loading")}
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-muted">
                  {t("crud.experiences.empty")}
                </td>
              </tr>
            ) : (
              items.map((row, index) => (
                <tr
                  key={row.id}
                  className={TABLE_ROW_HOVER_CLASS}
                  tabIndex={0}
                  onClick={() => setViewing(row)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setViewing(row);
                    }
                  }}
                >
                  <td className="px-3 py-2 text-muted">
                    {(page - 1) * pageSize + index + 1}
                  </td>
                  <td className="px-3 py-2 font-medium">{row.category}</td>
                  <td className="max-w-40 truncate px-3 py-2 text-muted">
                    {row.problem}
                  </td>
                  <td className="max-w-40 truncate px-3 py-2 text-muted">
                    {row.actions}
                  </td>
                  <td className="max-w-40 truncate px-3 py-2 text-muted">
                    {row.outcome}
                  </td>
                  <td
                    className="cursor-default px-3 py-2"
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
                  >
                    <div className="flex justify-end gap-2">
                      <EditButton
                        onClick={() =>
                          router.push(`/experiences/${row.id}/edit`)
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

      {viewing ? (
        <ExperienceDetailDialog
          experience={viewing}
          onClose={() => setViewing(null)}
        />
      ) : null}

      {deleting ? (
        <DetailDialog
          title={t("crud.experiences.delete.title")}
          role="alertdialog"
          closeDisabled={deletingBusy}
          onClose={() => setDeleting(null)}
        >
          <p className="text-muted">
            {t("crud.experiences.delete.body", { name: deleting.category })}
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
