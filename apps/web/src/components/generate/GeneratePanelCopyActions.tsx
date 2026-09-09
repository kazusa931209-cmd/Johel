"use client";

import type { ReactNode } from "react";
import { useT } from "@/components/app/LocaleProvider";
import { useToast } from "@/components/app/ToastProvider";
import { CopyButton } from "@/components/shared/action-icon-buttons";
import { copyTextToClipboard } from "@/lib/copy-to-clipboard";

type GeneratePanelCopyActionsProps = {
  text: string;
  trailing?: ReactNode;
};

export function GeneratePanelCopyActions({
  text,
  trailing,
}: GeneratePanelCopyActionsProps) {
  const { toast } = useToast();
  const t = useT();

  async function handleCopy() {
    const ok = await copyTextToClipboard(text);
    if (ok) {
      toast(t("toast.copied"), "success");
    } else {
      toast(t("toast.copyFailed"), "error");
    }
  }

  return (
    <div className="flex items-center gap-2">
      {trailing}
      <CopyButton disabled={!text.trim()} onClick={() => void handleCopy()} />
    </div>
  );
}
