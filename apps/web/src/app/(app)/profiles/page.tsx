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
import { ProfileDetailDialog } from "@/components/ProfileDetailDialog";
import {
  deleteProfile,
  listProfiles,
  type ProfileDetail,
} from "@/lib/api";
import { formatLinksCell, fullName } from "@/lib/profile";

export default function ProfilesPage() {
  const router = useRouter();
  const t = useT();
  const { toast } = useToast();
  const [qInput, setQInput] = useState("");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<ProfileDetail[]>([]);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<ProfileDetail | null>(null);
  const [deletingBusy, setDeletingBusy] = useState(false);
  const [viewing, setViewing] = useState<ProfileDetail | null>(null);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const load = useCallback(
    async (nextQ: string, nextPage: number) => {
      setLoading(true);
      const res = await listProfiles(nextQ, nextPage);
      setLoading(false);
      if (res.error || !res.data) {
        toast(res.error ?? t("toast.profilesLoadFailed"), "error");
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
    const res = await deleteProfile(deleting.id);
    setDeletingBusy(false);
    if (res.error) {
      toast(res.error, "error");
      return;
    }
    setDeleting(null);
    toast(t("toast.profileDeleted"), "success");
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
        {t("crud.profiles.title")}
      </h1>
      <form onSubmit={onFilter} className="flex items-center gap-2">
        <input
          type="search"
          value={qInput}
          onChange={(e) => setQInput(e.target.value)}
          placeholder={t("crud.profiles.searchPlaceholder")}
          className="min-w-0 flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-muted"
        />
        <button
          type="submit"
          className="rounded-md border border-border px-3 py-2 text-sm hover:bg-surface-muted"
        >
          {t("crud.common.search")}
        </button>
        <AddButton
          onClick={() => router.push("/profiles/new")}
          className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-accent text-accent-fg hover:opacity-90"
        />
      </form>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-120 text-left text-sm">
          <thead className="border-b border-border bg-surface-muted text-muted">
            <tr>
              <th className="px-3 py-2 font-medium">{t("crud.common.no")}</th>
              <th className="px-3 py-2 font-medium">
                {t("crud.profiles.columns.fullName")}
              </th>
              <th className="px-3 py-2 font-medium">
                {t("crud.profiles.columns.birthDate")}
              </th>
              <th className="px-3 py-2 font-medium">
                {t("crud.profiles.columns.links")}
              </th>
              <th className="px-3 py-2 font-medium">
                {t("crud.profiles.columns.residence")}
              </th>
              <th className="px-3 py-2 font-medium">
                {t("crud.profiles.columns.education")}
              </th>
              <th className="px-3 py-2 font-medium" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} className="px-3 py-8 text-center text-muted">
                  {t("crud.common.loading")}
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-3 py-8 text-center text-muted">
                  {t("crud.profiles.empty")}
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
                  <td className="px-3 py-2 font-medium">
                    {fullName(row.firstName, row.lastName)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-muted">
                    {row.birthDate ?? ""}
                  </td>
                  <td className="max-w-30 truncate px-3 py-2 text-muted">
                    {formatLinksCell(row.links)}
                  </td>
                  <td className="max-w-10 truncate px-3 py-2 text-muted">
                    {row.residence ?? ""}
                  </td>
                  <td className="max-w-20 truncate px-3 py-2 text-muted">
                    {row.education ?? ""}
                  </td>
                  <td
                    className="cursor-default px-3 py-2"
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
                  >
                    <div className="flex justify-end gap-2">
                      <EditButton
                        onClick={() =>
                          router.push(`/profiles/${row.id}/edit`)
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
        <ProfileDetailDialog
          profile={viewing}
          onClose={() => setViewing(null)}
        />
      ) : null}

      {deleting ? (
        <DetailDialog
          title={t("crud.profiles.delete.title")}
          role="alertdialog"
          closeDisabled={deletingBusy}
          onClose={() => setDeleting(null)}
        >
          <p className="text-muted">
            {t("crud.profiles.delete.body", {
              name: fullName(deleting.firstName, deleting.lastName),
            })}
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
