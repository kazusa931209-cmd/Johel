"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
        toast(res.error ?? "Failed to load profiles", "error");
        return;
      }
      setItems(res.data.items);
      setTotal(res.data.total);
      setPageSize(res.data.pageSize);
      setPage(res.data.page);
    },
    [toast],
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
    toast("Profile deleted.", "success");
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
      <h1 className="text-2xl font-semibold tracking-tight">Profiles</h1>
      <form onSubmit={onFilter} className="flex items-center gap-2">
        <input
          type="search"
          value={qInput}
          onChange={(e) => setQInput(e.target.value)}
          placeholder="Search name, email, PN, residence, education"
          className="min-w-0 flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-muted"
        />
        <button
          type="submit"
          className="rounded-md border border-border px-3 py-2 text-sm hover:bg-surface-muted"
        >
          Search
        </button>
        <AddButton
          onClick={() => router.push("/profiles/new")}
          className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-accent text-accent-fg hover:opacity-90"
        />
      </form>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-[960px] text-left text-sm">
          <thead className="border-b border-border bg-surface-muted text-muted">
            <tr>
              <th className="px-3 py-2 font-medium">No</th>
              <th className="px-3 py-2 font-medium">Full Name</th>
              <th className="px-3 py-2 font-medium">Birth date</th>
              <th className="px-3 py-2 font-medium">Email</th>
              <th className="px-3 py-2 font-medium">PN</th>
              <th className="px-3 py-2 font-medium">Links</th>
              <th className="px-3 py-2 font-medium">Residence</th>
              <th className="px-3 py-2 font-medium">Education</th>
              <th className="px-3 py-2 font-medium" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} className="px-3 py-8 text-center text-muted">
                  Loading…
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-3 py-8 text-center text-muted">
                  No profiles yet.
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
                  <td className="max-w-[180px] truncate px-3 py-2 text-muted">
                    {row.email ?? ""}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-muted">
                    {row.pn ?? ""}
                  </td>
                  <td className="max-w-[180px] truncate px-3 py-2 text-muted">
                    {formatLinksCell(row.links)}
                  </td>
                  <td className="max-w-[140px] truncate px-3 py-2 text-muted">
                    {row.residence ?? ""}
                  </td>
                  <td className="max-w-[160px] truncate px-3 py-2 text-muted">
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
          Page {page} of {totalPages}
        </span>
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          className="rounded-md border border-border px-2 py-1 disabled:opacity-40"
        >
          Prev
        </button>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => setPage((p) => p + 1)}
          className="rounded-md border border-border px-2 py-1 disabled:opacity-40"
        >
          Next
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
          title="Delete profile"
          role="alertdialog"
          closeDisabled={deletingBusy}
          onClose={() => setDeleting(null)}
        >
          <p className="text-muted">
            Delete profile “
            {fullName(deleting.firstName, deleting.lastName)}”? This cannot be
            undone.
          </p>
          <div className="flex justify-end">
            <button
              type="button"
              disabled={deletingBusy}
              onClick={() => void onConfirmDelete()}
              className="rounded-md bg-toast-error-bg px-3 py-2 text-sm font-medium text-toast-error-fg disabled:opacity-60"
            >
              {deletingBusy ? "Deleting…" : "Delete"}
            </button>
          </div>
        </DetailDialog>
      ) : null}
    </section>
  );
}
