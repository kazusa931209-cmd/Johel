"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ToastProvider";
import { deleteWorkflow, listWorkflows, type Workflow } from "@/lib/api";

function formatDate(iso: string) {
  return new Date(iso).toLocaleString();
}

export default function WorkflowsPage() {
  const router = useRouter();
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

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const load = useCallback(
    async (nextQ: string, nextPage: number) => {
      setLoading(true);
      const res = await listWorkflows(nextQ, nextPage);
      setLoading(false);
      if (res.error || !res.data) {
        toast(res.error ?? "Failed to load workflows", "error");
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
    const res = await deleteWorkflow(deleting.id);
    setDeletingBusy(false);
    if (res.error) {
      toast(res.error, "error");
      return;
    }
    setDeleting(null);
    toast("Workflow deleted.", "success");
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
      <h1 className="text-2xl font-semibold tracking-tight">Workflows</h1>
      <form onSubmit={onFilter} className="flex items-center gap-2">
        <input
          type="search"
          value={qInput}
          onChange={(e) => setQInput(e.target.value)}
          placeholder="Search name or description"
          className="min-w-0 flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-muted"
        />
        <button
          type="submit"
          className="rounded-md border border-border px-3 py-2 text-sm hover:bg-surface-muted"
        >
          Search
        </button>
        <button
          type="button"
          onClick={() => router.push("/workflows/new")}
          className="rounded-md bg-accent px-3 py-2 text-sm font-medium text-accent-fg hover:opacity-90"
        >
          Add
        </button>
      </form>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-border bg-surface-muted text-muted">
            <tr>
              <th className="px-3 py-2 font-medium">No</th>
              <th className="px-3 py-2 font-medium">Name</th>
              <th className="px-3 py-2 font-medium">Description</th>
              <th className="px-3 py-2 font-medium">Used</th>
              <th className="px-3 py-2 font-medium">Created</th>
              <th className="px-3 py-2 font-medium">Updated</th>
              <th className="px-3 py-2 font-medium" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-muted">
                  Loading…
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-muted">
                  No workflows yet.
                </td>
              </tr>
            ) : (
              items.map((row, index) => (
                <tr key={row.id} className="border-b border-border last:border-0">
                  <td className="px-3 py-2 text-muted">
                    {(page - 1) * pageSize + index + 1}
                  </td>
                  <td className="px-3 py-2 font-medium">{row.name}</td>
                  <td className="max-w-[220px] truncate px-3 py-2 text-muted">
                    {row.description ?? ""}
                  </td>
                  <td className="px-3 py-2">{row.used}</td>
                  <td className="whitespace-nowrap px-3 py-2 text-muted">
                    {formatDate(row.createdAt)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-muted">
                    {formatDate(row.updatedAt)}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => router.push(`/workflows/${row.id}/edit`)}
                        className="rounded-md border border-border px-2 py-1 text-xs hover:bg-surface-muted"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleting(row)}
                        className="rounded-md border border-border px-2 py-1 text-xs hover:bg-surface-muted"
                      >
                        Delete
                      </button>
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

      {deleting ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          role="presentation"
          onClick={() => {
            if (!deletingBusy) setDeleting(null);
          }}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-workflow-title"
            aria-describedby="delete-workflow-desc"
            className="w-full max-w-md space-y-4 rounded-lg border border-border bg-surface p-4 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-2">
              <h2 id="delete-workflow-title" className="text-lg font-semibold">
                Delete workflow
              </h2>
              <p id="delete-workflow-desc" className="text-sm text-muted">
                Delete workflow “{deleting.name}”? This cannot be undone.
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                disabled={deletingBusy}
                onClick={() => setDeleting(null)}
                className="rounded-md border border-border px-3 py-2 text-sm hover:bg-surface-muted disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deletingBusy}
                onClick={() => void onConfirmDelete()}
                className="rounded-md bg-toast-error-bg px-3 py-2 text-sm font-medium text-toast-error-fg disabled:opacity-60"
              >
                {deletingBusy ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
