export type GenerationProcessedStep =
  | "Job"
  | "Verdict"
  | "Combine"
  | "Generate"
  | "Evaluate";

function normalizeStep(value: string): GenerationProcessedStep {
  if (
    value === "Job" ||
    value === "Verdict" ||
    value === "Combine" ||
    value === "Generate" ||
    value === "Evaluate"
  ) {
    return value;
  }
  if (value === "Workflow" || value === "PCEW" || value === "Company") {
    return "Combine";
  }
  return "Job";
}

function combineHasProgress(combineJson: string): boolean {
  try {
    const combine = JSON.parse(combineJson) as {
      profileId?: string;
      companies?: unknown[];
    };
    return Boolean(
      combine.profileId?.trim() ||
        (Array.isArray(combine.companies) && combine.companies.length > 0),
    );
  } catch {
    return false;
  }
}

function jobHasContent(jobJson: string): boolean {
  try {
    const job = JSON.parse(jobJson) as {
      jobText?: string;
      acceptedMarkdown?: string | null;
    };
    return Boolean(job.jobText?.trim() || job.acceptedMarkdown?.trim());
  } catch {
    return false;
  }
}

export function deriveProcessedStep(generation: {
  activeStep: string;
  jobJson: string;
  combineJson: string;
  verdictMarkdown: string | null;
  resumeJson: string | null;
  evaluationMarkdown: string | null;
}): GenerationProcessedStep {
  if (generation.evaluationMarkdown?.trim()) {
    return "Evaluate";
  }
  if (generation.resumeJson) {
    return "Generate";
  }
  if (combineHasProgress(generation.combineJson)) {
    return "Combine";
  }
  if (generation.verdictMarkdown?.trim()) {
    return "Verdict";
  }
  if (jobHasContent(generation.jobJson)) {
    return "Job";
  }
  return normalizeStep(generation.activeStep);
}
