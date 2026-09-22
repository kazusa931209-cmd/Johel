"use client";

import { FormEvent, Suspense, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useT } from "@/components/app/LocaleProvider";
import { useToast } from "@/components/app/ToastProvider";
import {
  AddButton,
  DeleteButton,
  EditButton,
} from "@/components/shared/action-icon-buttons";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { TABLE_ROW_HOVER_CLASS } from "@/components/shared/detail-dialog";
import { CompanyDetailDialog } from "@/components/CompanyDetailDialog";
import { formatThousandsSeparated } from "@/lib/helper";
import { deleteCompany, type CompanyDetail } from "@/lib/api";
import {
  invalidateWorkspaceCrudCaches,
  loadCompanyList,
} from "@/lib/cached-crud-list";
import { useCrudListParams } from "@/lib/crud-list-params";

function CompaniesPageFallback() {
  const t = useT();
  return (
    <section className="space-y-4">
      <p className="text-sm text-muted">{t("crud.common.loading")}</p>
    </section>
  );
}

export default function CompaniesPage() {
  return (
    <Suspense fallback={<CompaniesPageFallback />}>
      <CompaniesPageContent />
    </Suspense>
  );
}

function CompaniesPageContent() {
  const router = useRouter();
  const t = useT();
  const { toast } = useToast();
  const { page, q, setPage, applySearch } = useCrudListParams();
  const [qInput, setQInput] = useState(q);
  const [items, setItems] = useState<CompanyDetail[]>([]);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<CompanyDetail | null>(null);
  const [deletingBusy, setDeletingBusy] = useState(false);
  const [viewing, setViewing] = useState<CompanyDetail | null>(null);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  useEffect(() => {
    setQInput(q);
  }, [q]);

  const load = useCallback(
    async (nextQ: string, nextPage: number) => {
      setLoading(true);
      const res = await loadCompanyList(nextQ, nextPage);
      setLoading(false);
      if (res.error || !res.data) {
        toast(res.error ?? t("toast.companiesLoadFailed"), "error");
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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reload when filters change; cached loader dedupes Strict Mode
  }, [q, page]);

  async function onConfirmDelete() {
    if (!deleting) return;
    setDeletingBusy(true);
    const res = await deleteCompany(deleting.id);
    setDeletingBusy(false);
    if (res.error) {
      toast(res.error, "error");
      return;
    }
    setDeleting(null);
    invalidateWorkspaceCrudCaches("companies");
    toast(t("toast.companyDeleted"), "success");
    const nextPage = items.length === 1 && page > 1 ? page - 1 : page;
    if (nextPage !== page) {
      setPage(nextPage);
    } else {
      void load(q, page);
    }
  }

  function onFilter(e: FormEvent) {
    e.preventDefault();
    applySearch(qInput.trim());
  }

  return (
    <section className="space-y-4">
      <form onSubmit={onFilter} className="flex items-center gap-2">
        <input
          type="search"
          value={qInput}
          onChange={(e) => setQInput(e.target.value)}
          placeholder={t("crud.companies.searchPlaceholder")}
          className="min-w-0 flex-1 rounded-md border border-border bg-background px-3 py-2 font-mono text-sm outline-none focus:border-muted"
        />
        <button
          type="submit"
          className="rounded-md border border-border px-3 py-2 text-sm hover:bg-surface-muted"
        >
          {t("crud.common.search")}
        </button>
        <AddButton
          onClick={() => router.push("/companies/new")}
          className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-accent text-accent-fg hover:opacity-90"
        />
      </form>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-120 text-left text-sm">
          <thead className="border-b border-border bg-surface-muted text-muted">
            <tr>
              <th className="px-3 py-2 font-medium">{t("crud.common.no")}</th>
              <th className="px-3 py-2 font-medium">
                {t("crud.companies.columns.displayPriority")}
              </th>
              <th className="px-3 py-2 font-medium">
                {t("crud.companies.columns.alias")}
              </th>
              <th className="px-3 py-2 font-medium">
                {t("crud.companies.columns.companyName")}
              </th>
              <th className="px-3 py-2 font-medium">
                {t("crud.companies.columns.whatCompanyIs")}
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
                  {t("crud.companies.empty")}
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
                  <td className="w-16 px-3 py-2 text-muted">
                    {formatThousandsSeparated((page - 1) * pageSize + index + 1)}
                  </td>
                  <td className="max-w-10 px-3 py-2 tabular-nums text-muted">
                    {formatThousandsSeparated(row.displayPriority)}
                  </td>
                  <td className="px-3 py-2 font-medium">{row.alias}</td>
                  <td className="px-3 py-2">{row.name}</td>
                  <td className="max-w-40 truncate px-3 py-2 text-muted">
                    {row.whatCompanyIs}
                  </td>
                  <td
                    className="cursor-default px-3 py-2"
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
                  >
                    <div className="flex justify-end gap-2">
                      <EditButton
                        onClick={() =>
                          router.push(`/companies/${row.id}/edit`)
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

      {viewing ? (
        <CompanyDetailDialog
          company={viewing}
          onClose={() => setViewing(null)}
        />
      ) : null}

      {deleting ? (
        <ConfirmDialog
          title={t("crud.companies.delete.title")}
          variant="danger"
          closeDisabled={deletingBusy}
          confirmDisabled={deletingBusy}
          onClose={() => setDeleting(null)}
          onConfirm={() => void onConfirmDelete()}
          confirmLabel={
            deletingBusy ? t("crud.common.deleting") : t("crud.common.delete")
          }
        >
          <p className="text-muted">
            {t("crud.companies.delete.body", { name: deleting.name })}
          </p>
        </ConfirmDialog>
      ) : null}
    </section>
  );
}
