"use client";

import { useT } from "@/components/app/LocaleProvider";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";

type CombineSuggestConfirmDialogsProps = {
  suggestConfirmOpen: boolean;
  companySuggestConfirmId: string | null;
  companySuggestConfirmName: string;
  suggesting: boolean;
  onCloseSuggestConfirm: () => void;
  onConfirmSuggest: () => void;
  onCloseCompanySuggestConfirm: () => void;
  onConfirmCompanySuggest: () => void;
};

export function CombineSuggestConfirmDialogs({
  suggestConfirmOpen,
  companySuggestConfirmId,
  companySuggestConfirmName,
  suggesting,
  onCloseSuggestConfirm,
  onConfirmSuggest,
  onCloseCompanySuggestConfirm,
  onConfirmCompanySuggest,
}: CombineSuggestConfirmDialogsProps) {
  const t = useT();

  return (
    <>
      {suggestConfirmOpen ? (
        <ConfirmDialog
          title={t("generate.combine.suggestConfirm.title")}
          closeDisabled={suggesting}
          confirmDisabled={suggesting}
          onClose={onCloseSuggestConfirm}
          onConfirm={onConfirmSuggest}
          confirmLabel={
            suggesting
              ? t("generate.combine.suggesting")
              : t("generate.combine.suggestConfirm.confirm")
          }
        >
          <p className="text-muted">{t("generate.combine.suggestConfirm.body")}</p>
        </ConfirmDialog>
      ) : null}

      {companySuggestConfirmId ? (
        <ConfirmDialog
          title={t("generate.combine.suggestCompanyConfirm.title")}
          closeDisabled={suggesting}
          confirmDisabled={suggesting}
          onClose={onCloseCompanySuggestConfirm}
          onConfirm={onConfirmCompanySuggest}
          confirmLabel={
            suggesting
              ? t("generate.combine.suggesting")
              : t("crud.experiences.advisor.suggest")
          }
        >
          <p className="text-muted">
            {t("generate.combine.suggestCompanyConfirm.body", {
              name: companySuggestConfirmName,
            })}
          </p>
        </ConfirmDialog>
      ) : null}
    </>
  );
}
