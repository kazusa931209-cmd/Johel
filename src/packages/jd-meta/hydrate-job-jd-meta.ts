import { extractJdMetaFromVerdictMarkdown } from "./extract-from-verdict";

export type JobJdMetaFields = {
  acceptedMarkdown?: string | null;
  jdCompanyName?: string;
  jdJobRole?: string;
};

/** Fills empty JD meta fields from verdict markdown when present. */
export function hydrateJobJdMetaFromVerdict<T extends JobJdMetaFields>(job: T): T {
  const markdown = job.acceptedMarkdown?.trim();
  if (!markdown) {
    return job;
  }

  const hasCompany = Boolean(job.jdCompanyName?.trim());
  const hasRole = Boolean(job.jdJobRole?.trim());
  if (hasCompany && hasRole) {
    return job;
  }

  const extracted = extractJdMetaFromVerdictMarkdown(markdown);
  return {
    ...job,
    jdCompanyName: hasCompany ? job.jdCompanyName : extracted.jdCompanyName,
    jdJobRole: hasRole ? job.jdJobRole : extracted.jdJobRole,
  };
}
