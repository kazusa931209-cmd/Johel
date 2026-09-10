"use client";

import { ReactNode } from "react";
import { useT } from "@/components/app/LocaleProvider";
import { ViewButton } from "@/components/shared/action-icon-buttons";
import {
  COMBINE_SECTION_CLASS,
  COMBINE_SECTION_TITLE_CLASS,
} from "@/components/generate/combine-section-styles";
import { TABLE_ROW_HOVER_CLASS } from "@/components/shared/detail-dialog";

type Column<T> = {
  header: string;
  className?: string;
  cell: (row: T) => ReactNode;
};

type PceSectionProps<T extends { id: string }> = {
  title: string;
  emptyLabel: string;
  error?: string;
  selectionMode: "single" | "multiple";
  isSelected: (id: string) => boolean;
  onRowSelect: (id: string, row: T) => void;
  columns: Column<T>[];
  minWidthClass?: string;
  items: T[];
  loading: boolean;
  viewing: T | null;
  onView: (row: T) => void;
  renderDetailDialog: (row: T) => ReactNode;
};

const SELECTED_ROW_CLASS = "bg-accent-fg text-accent";

export function PceSection<T extends { id: string }>({
  title,
  emptyLabel,
  error,
  selectionMode,
  isSelected,
  onRowSelect,
  columns,
  minWidthClass = "min-w-[640px]",
  items,
  loading,
  viewing,
  onView,
  renderDetailDialog,
}: PceSectionProps<T>) {
  const t = useT();
  const colSpan = columns.length + 2;

  return (
    <section className={COMBINE_SECTION_CLASS}>
      <div className="space-y-1">
        <h3 className={COMBINE_SECTION_TITLE_CLASS}>{title}</h3>
        {selectionMode === "single" ? (
          <p className="text-xs text-muted">{t("generate.pceSection.selectSingle")}</p>
        ) : (
          <p className="text-xs text-muted">
            {t("generate.pceSection.selectMultiple")}
          </p>
        )}
      </div>

      <div className="overflow-x-auto overflow-y-hidden rounded-lg border border-border">
        <table className={`w-full ${minWidthClass} text-left text-sm`}>
          <thead className="border-b border-border bg-surface-muted text-muted">
            <tr>
              <th className="w-10 px-3 py-2">
                <span className="sr-only">{t("generate.pceSection.selectColumn")}</span>
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
                  {t("generate.pceSection.loading")}
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
                    onClick={() => onRowSelect(row.id, row)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onRowSelect(row.id, row);
                      }
                    }}
                  >
                    <td
                      className="px-3 py-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRowSelect(row.id, row);
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
