"use client";

import { ReactNode } from "react";
import { ViewButton } from "@/components/shared/action-icon-buttons";
import { TABLE_ROW_HOVER_CLASS } from "@/components/shared/detail-dialog";
import { usePcewList } from "@/components/generate/usePcewList";

type Column<T> = {
  header: string;
  className?: string;
  cell: (row: T, rowNo: number) => ReactNode;
};

type PcewSectionProps<T extends { id: string }> = {
  title: string;
  searchPlaceholder: string;
  emptyLabel: string;
  error?: string;
  selectionMode: "single" | "multiple";
  isSelected: (id: string) => boolean;
  onRowSelect: (id: string) => void;
  columns: Column<T>[];
  minWidthClass?: string;
  fetchPage: (
    q: string,
    page: number,
  ) => Promise<{
    data?: {
      items: T[];
      total: number;
      page: number;
      pageSize: number;
    };
    error?: string;
  }>;
  loadErrorLabel: string;
  viewing: T | null;
  onView: (row: T) => void;
  renderDetailDialog: (row: T) => ReactNode;
};

const SELECTED_ROW_CLASS = "bg-accent-fg text-accent";

export function PcewSection<T extends { id: string }>({
  title,
  searchPlaceholder,
  emptyLabel,
  error,
  selectionMode,
  isSelected,
  onRowSelect,
  columns,
  minWidthClass = "min-w-[640px]",
  fetchPage,
  loadErrorLabel,
  viewing,
  onView,
  renderDetailDialog,
}: PcewSectionProps<T>) {
  const {
    qInput,
    setQInput,
    page,
    setPage,
    items,
    pageSize,
    loading,
    totalPages,
    onFilter,
  } = usePcewList(fetchPage, loadErrorLabel);

  const colSpan = columns.length + 2;

  return (
    <section className="space-y-3 rounded-lg border border-border p-4">
      <div className="space-y-1">
        <h3 className="text-base font-semibold tracking-tight">{title}</h3>
        {selectionMode === "single" ? (
          <p className="text-xs text-muted">Click a row to select one.</p>
        ) : (
          <p className="text-xs text-muted">
            Click rows to select or deselect multiple.
          </p>
        )}
      </div>

      <form onSubmit={onFilter} className="flex items-center gap-2">
        <input
          type="search"
          value={qInput}
          onChange={(e) => setQInput(e.target.value)}
          placeholder={searchPlaceholder}
          className="min-w-0 flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-muted"
        />
        <button
          type="submit"
          className="rounded-md border border-border px-3 py-2 text-sm hover:bg-surface-muted"
        >
          Search
        </button>
      </form>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className={`w-full ${minWidthClass} text-left text-sm`}>
          <thead className="border-b border-border bg-surface-muted text-muted">
            <tr>
              <th className="px-3 py-2 font-medium">No</th>
              {columns.map((column) => (
                <th
                  key={column.header}
                  className={`px-3 py-2 font-medium ${column.className ?? ""}`}
                >
                  {column.header}
                </th>
              ))}
              <th className="px-3 py-2 font-medium" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={colSpan} className="px-3 py-8 text-center text-muted">
                  Loading…
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={colSpan} className="px-3 py-8 text-center text-muted">
                  {emptyLabel}
                </td>
              </tr>
            ) : (
              items.map((row, index) => {
                const selected = isSelected(row.id);
                return (
                  <tr
                    key={row.id}
                    className={`${TABLE_ROW_HOVER_CLASS} ${
                      selected ? SELECTED_ROW_CLASS : ""
                    }`}
                    tabIndex={0}
                    aria-selected={selected}
                    onClick={() => onRowSelect(row.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onRowSelect(row.id);
                      }
                    }}
                  >
                    <td className="px-3 py-2 text-muted">
                      {(page - 1) * pageSize + index + 1}
                    </td>
                    {columns.map((column) => (
                      <td
                        key={column.header}
                        className={`px-3 py-2 ${column.className ?? ""}`}
                      >
                        {column.cell(row, (page - 1) * pageSize + index + 1)}
                      </td>
                    ))}
                    <td
                      className="cursor-default px-3 py-2"
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => e.stopPropagation()}
                    >
                      <div className="flex justify-end">
                        <ViewButton onClick={() => onView(row)} />
                      </div>
                    </td>
                  </tr>
                );
              })
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

      {error ? <p className="text-sm text-danger">{error}</p> : null}

      {viewing ? renderDetailDialog(viewing) : null}
    </section>
  );
}
