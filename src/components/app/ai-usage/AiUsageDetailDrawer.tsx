"use client";

import { useEffect, useState } from "react";
import { useT } from "@/components/app/LocaleProvider";
import { useToast } from "@/components/app/ToastProvider";
import { AiVerdictMarkdown } from "@/components/shared/AiVerdictMarkdown";
import { CopyButton } from "@/components/shared/action-icon-buttons";
import { Drawer } from "@/components/shared/drawer";
import type { AiUsageDetail } from "@/lib/api";
import { copyTextToClipboard } from "@/lib/copy-to-clipboard";

type AiUsageDetailTab = "input" | "output";

function AiUsageDetailPanel({
  detail,
  onCopy,
}: {
  detail: AiUsageDetail;
  onCopy: (text: string) => void;
}) {
  const t = useT();
  const [activeTab, setActiveTab] = useState<AiUsageDetailTab>("input");

  const detailTabs: { id: AiUsageDetailTab; label: string }[] = [
    { id: "input", label: t("aiUsage.input") },
    { id: "output", label: t("aiUsage.output") },
  ];

  useEffect(() => {
    setActiveTab("input");
  }, [detail.id]);

  const rawText = activeTab === "input" ? detail.input : detail.output;
  const tabPanelId = `ai-usage-detail-${activeTab}`;

  return (
    <section
      className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-border bg-background text-sm"
      aria-label={t("aiUsage.detailContentAria")}
    >
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border bg-surface-muted px-3 py-2">
        <div className="flex gap-1" role="tablist" aria-label={t("aiUsage.tabsAria")}>
          {detailTabs.map((tab) => {
            const selected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                id={`ai-usage-detail-tab-${tab.id}`}
                aria-selected={selected}
                aria-controls={tabPanelId}
                className={[
                  "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  selected
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted hover:text-foreground",
                ].join(" ")}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
        <CopyButton
          disabled={!rawText.trim()}
          onClick={() => onCopy(rawText)}
        />
      </div>
      <div
        id={tabPanelId}
        role="tabpanel"
        aria-labelledby={`ai-usage-detail-tab-${activeTab}`}
        className="min-h-0 flex-1 overflow-auto p-3"
      >
        {rawText.trim() ? (
          <AiVerdictMarkdown markdown={rawText} />
        ) : (
          <p className="text-sm text-muted">{t("crud.common.emDash")}</p>
        )}
      </div>
    </section>
  );
}

export function AiUsageDetailDrawer({
  detail,
  loading,
  onClose,
}: {
  detail: AiUsageDetail | null;
  loading: boolean;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const t = useT();
  const open = loading || detail != null;

  async function handleCopy(text: string) {
    const ok = await copyTextToClipboard(text);
    if (ok) {
      toast(t("toast.copied"), "success");
    } else {
      toast(t("toast.copyFailed"), "error");
    }
  }

  return (
    <Drawer
      title={t("aiUsage.detailTitle")}
      open={open}
      onClose={onClose}
      widthClass="w-[min(56rem,85vw)]"
      zIndex={60}
      closeOnEscape
    >
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-4">
        {loading ? (
          <p className="text-sm text-muted">{t("aiUsage.loading")}</p>
        ) : detail ? (
          <AiUsageDetailPanel
            detail={detail}
            onCopy={(text) => void handleCopy(text)}
          />
        ) : null}
      </div>
    </Drawer>
  );
}
