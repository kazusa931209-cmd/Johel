"use client";

import { useLocale, useT } from "@/components/app/LocaleProvider";
import { TABLE_ROW_HOVER_CLASS } from "@/components/shared/detail-dialog";
import {
  formatAiProvider,
  formatAiUsageDate,
  formatGenerateType,
} from "@/lib/ai-usage";
import type { AiUsageListItem } from "@/lib/api";
import { formatThousandsSeparated } from "@/lib/helper";

export function AiUsageItemsTable({
  items,
  startNo = 0,
  showGenerationIdColumn = true,
  onRowClick,
}: {
  items: AiUsageListItem[];
  startNo?: number;
  showGenerationIdColumn?: boolean;
  onRowClick: (id: string) => void;
}) {
  const t = useT();
  const { locale } = useLocale();

  return (
    <table className="w-full min-w-240 text-left text-sm">
      <thead className="border-b border-border bg-background text-muted">
        <tr>
          <th className="px-3 py-2 font-medium">{t("aiUsage.columns.no")}</th>
          {showGenerationIdColumn ? (
            <th className="px-3 py-2 font-medium">
              {t("aiUsage.columns.generationId")}
            </th>
          ) : null}
          <th className="px-3 py-2 font-medium">{t("aiUsage.columns.ai")}</th>
          <th className="px-3 py-2 font-medium">{t("aiUsage.columns.model")}</th>
          <th className="px-3 py-2 font-medium">
            {t("aiUsage.columns.generateType")}
          </th>
          <th className="px-3 py-2 font-medium">
            {t("aiUsage.columns.inputToken")}
          </th>
          <th className="px-3 py-2 font-medium">
            {t("aiUsage.columns.outputToken")}
          </th>
          <th className="px-3 py-2 font-medium">
            {t("aiUsage.columns.createdAt")}
          </th>
        </tr>
      </thead>
      <tbody>
        {items.map((row, index) => (
          <tr
            key={row.id}
            className={TABLE_ROW_HOVER_CLASS}
            tabIndex={0}
            onClick={() => onRowClick(row.id)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onRowClick(row.id);
              }
            }}
          >
            <td className="px-3 py-2 text-muted">
              {formatThousandsSeparated(startNo + index + 1)}
            </td>
            {showGenerationIdColumn ? (
              <td className="px-3 py-2 text-muted">
                {row.generationPublicId ?? ""}
              </td>
            ) : null}
            <td className="px-3 py-2">
              {formatAiProvider(row.aiProvider, locale)}
            </td>
            <td className="px-3 py-2 text-muted">{row.modelName}</td>
            <td className="px-3 py-2">
              {formatGenerateType(row.generateType, locale)}
            </td>
            <td className="px-3 py-2 tabular-nums">
              {formatThousandsSeparated(row.inputToken)}
            </td>
            <td className="px-3 py-2 tabular-nums">
              {formatThousandsSeparated(row.outputToken)}
            </td>
            <td className="px-3 py-2 text-muted">
              {formatAiUsageDate(row.createdAt, locale)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
