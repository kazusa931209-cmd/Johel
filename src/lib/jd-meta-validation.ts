export type GenerateJdMetaFieldErrors = {
  jdCompanyName?: string;
  jdJobRole?: string;
};

export function validateGenerateJdMetaFields(
  jdCompanyName: string,
  jdJobRole: string,
  t: (key: string) => string,
): GenerateJdMetaFieldErrors {
  const errors: GenerateJdMetaFieldErrors = {};

  if (!jdCompanyName.trim()) {
    errors.jdCompanyName = t("validation.jdCompanyNameRequired");
  }
  if (!jdJobRole.trim()) {
    errors.jdJobRole = t("validation.jdRoleRequired");
  }

  return errors;
}
