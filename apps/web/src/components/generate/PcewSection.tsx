"use client";

import { ReactNode, useEffect, useState } from "react";
import { useToast } from "@/components/app/ToastProvider";
import { ViewButton } from "@/components/shared/action-icon-buttons";
import { TABLE_ROW_HOVER_CLASS } from "@/components/shared/detail-dialog";

type Column<T> = {
  header: string;
  className?: string;
  cell: (row: T) => ReactNode;
};

type PcewSectionProps<T extends { id: string }> = {
  title: string;
  emptyLabel: string;
  error?: string;
  selectionMode: "single" | "multiple";
  isSelected: (id: string) => boolean;
  onRowSelect: (id: string) => void;
  columns: Column<T>[];
  minWidthClass?: string;
  fetchAll: () => Promise<{
    data?: { items: T[] };
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
  emptyLabel,
  error,
  selectionMode,
  isSelected,
  onRowSelect,
  columns,
  minWidthClass = "min-w-[640px]",
  fetchAll,
  loadErrorLabel,
  viewing,
  onView,
  renderDetailDialog,
}: PcewSectionProps<T>) {
  const { toast } = useToast();
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchAll().then((res) => {
      if (cancelled) return;
      if (res.error || !res.data) {
        toast(res.error ?? loadErrorLabel, "error");
        setItems([]);
        setLoading(false);
        return;
      }
      setItems(res.data.items);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [fetchAll, loadErrorLabel, toast]);

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

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className={`w-full ${minWidthClass} text-left text-sm`}>
          <thead className="border-b border-border bg-surface-muted text-muted">
            <tr>
              <th className="w-10 px-3 py-2">
                <span className="sr-only">Select</span>
              </th>
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
              items.map((row) => {
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
                    <td
                      className="px-3 py-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRowSelect(row.id);
                      }}
                      onKeyDown={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={selected}
                        readOnly
                        tabIndex={-1}
                        aria-hidden
                        className="h-4 w-4 rounded border-border"
                      />
                    </td>
                    {columns.map((column) => (
                      <td
                        key={column.header}
                        className={`px-3 py-2 ${column.className ?? ""}`}
                      >
                        {column.cell(row)}
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

      {error ? <p className="text-sm text-danger">{error}</p> : null}

      {viewing ? renderDetailDialog(viewing) : null}
    </section>
  );
}
