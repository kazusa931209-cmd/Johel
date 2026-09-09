import type { ProfileDetail, ProfileWritePayload } from "./profile";
import type { CompanyDetail, CompanyWritePayload } from "./company";
import type { ExperienceDetail, ExperienceWritePayload } from "./experience";
import type { GenerateJobState } from "./generate-session";
import { AI_API_TIMEOUT_MS, API_TIMEOUT_MS } from "./api-timeout";

export type {
  ProfileDetail,
  ProfileLinkItem,
  ProfileWritePayload,
} from "./profile";

export type {
  CompanyDetail,
  CompanyWritePayload,
} from "./company";

export type {
  ExperienceDetail,
  ExperienceWritePayload,
} from "./experience";

export type User = {
  id: string;
  email: string;
  role: string;
};

type ApiError = {
  error?: string;
};

async function parseJson<T>(res: Response): Promise<T> {
  return (await res.json()) as T;
}

type RequestOptions = RequestInit & {
  timeoutMs?: number;
};

async function request<T>(
  path: string,
  init?: RequestOptions,
): Promise<{ data?: T; error?: string; status: number }> {
  const { timeoutMs = API_TIMEOUT_MS, ...fetchInit } = init ?? {};

  try {
    const res = await fetch(`/backend${path}`, {
      ...fetchInit,
      credentials: "include",
      signal: AbortSignal.timeout(timeoutMs),
      headers: {
        "Content-Type": "application/json",
        ...(fetchInit.headers ?? {}),
      },
    });

    if (res.status === 204) {
      return { status: res.status };
    }

    const body = await parseJson<T & ApiError>(res).catch(() => null);
    if (!res.ok) {
      return {
        status: res.status,
        error:
          body && "error" in body && body.error ? body.error : "Request failed",
      };
    }

    return { status: res.status, data: body as T };
  } catch (error) {
    const timedOut =
      error instanceof Error &&
      (error.name === "TimeoutError" || error.name === "AbortError");
    if (timedOut) {
      return {
        status: 504,
        error: "Request timed out. Please try again.",
      };
    }
    return { status: 0, error: "Request failed" };
  }
}

export function getMe() {
  return request<User>("/auth/me");
}

export function register(email: string, password: string) {
  return request<User>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function login(email: string, password: string) {
  return request<User>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function logout() {
  return request<{ ok: boolean }>("/auth/logout", { method: "POST" });
}

export type AiProviderId = "cursor" | "openai";

export type AiSettings = {
  provider: AiProviderId | null;
  apiKeyMasked: string | null;
};

export function getSettings() {
  return request<AiSettings>("/settings");
}

export function saveSettings(provider: AiProviderId, apiKey: string) {
  return request<AiSettings>("/settings", {
    method: "PUT",
    body: JSON.stringify({ provider, apiKey }),
  });
}

export type ResumeLanguage = "en" | "ja" | "zh-TW" | "zh-CN" | "ko";

export type GenerationProcessSettings = {
  doVerdict: boolean;
  doEvaluate: boolean;
  resumeLanguage: ResumeLanguage;
};

export function getGenerationProcess() {
  return request<GenerationProcessSettings>("/settings/process");
}

export function saveGenerationProcess(payload: {
  doVerdict: boolean;
  doEvaluate: boolean;
  resumeLanguage: ResumeLanguage;
}) {
  return request<GenerationProcessSettings>("/settings/process", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export type PromptKind = "verdict" | "generate" | "evaluate";

export type PromptSettings = {
  verdictPrompt: string;
  generatePrompt: string;
  evaluatePrompt: string;
  verdictExtension: string;
  generateExtension: string;
  evaluateExtension: string;
};

export function getPrompts() {
  return request<PromptSettings>("/prompts");
}

export function savePrompt(kind: PromptKind, prompt: string) {
  const body =
    kind === "verdict"
      ? { verdictPrompt: prompt }
      : kind === "generate"
        ? { generatePrompt: prompt }
        : { evaluatePrompt: prompt };
  return request<PromptSettings>(`/prompts/${kind}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export function savePromptExtension(kind: PromptKind, extension: string) {
  const body =
    kind === "verdict"
      ? { verdictExtension: extension }
      : kind === "generate"
        ? { generateExtension: extension }
        : { evaluateExtension: extension };
  return request<PromptSettings>(`/prompts/${kind}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export type CombineSnapshot = {
  profileId: string;
  language: string;
  emphasis: string;
  companies: Array<{
    companyId: string;
    startDate: string;
    endDate: string;
    roleContext: string;
    experienceIds: string[];
  }>;
};

export function getCombineGenerationFingerprint(combine: CombineSnapshot) {
  return request<{ fingerprint: string }>("/resume/combine-fingerprint", {
    method: "POST",
    body: JSON.stringify({ combine }),
  });
}

export type CombineRecommendRequest = {
  jobDescription: string;
  acceptedMarkdown?: string;
  profileId: string;
  companies: CombineSnapshot["companies"];
};

export type CombineRecommendCompanyResult = {
  companyId: string;
  experienceIds: string[];
  rationale: string;
};

export type CombineRecommendResult = {
  companies: CombineRecommendCompanyResult[];
  warnings: string[];
  usage: AiVerdictUsage;
  tokenUsed: number;
};

export type GenerationScopedRequest = {
  generationId?: string | null;
};

export function runAiCombineRecommend(
  payload: CombineRecommendRequest & GenerationScopedRequest,
) {
  return request<CombineRecommendResult>("/ai-combine-recommend", {
    method: "POST",
    body: JSON.stringify(payload),
    timeoutMs: AI_API_TIMEOUT_MS,
  });
}

function appendListParams(
  params: URLSearchParams,
  q: string,
  page?: number | null,
  limit?: number | null,
) {
  if (q) params.set("q", q);
  if (page === null) {
    params.set("page", "null");
  } else if (page != null) {
    params.set("page", String(page));
  }
  if (limit === null) {
    params.set("limit", "null");
  } else if (limit != null) {
    params.set("limit", String(limit));
  }
}

export type ProfileList = {
  items: ProfileDetail[];
  total: number;
  page: number;
  pageSize: number;
};

export function listProfiles(
  q: string,
  page: number | null = 1,
  limit?: number | null,
) {
  const params = new URLSearchParams();
  appendListParams(params, q, page, limit);
  return request<ProfileList>(`/profiles?${params.toString()}`);
}

export function getProfile(id: string) {
  return request<ProfileDetail>(`/profiles/${id}`);
}

export function createProfile(payload: ProfileWritePayload) {
  return request<ProfileDetail>("/profiles", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateProfile(id: string, payload: ProfileWritePayload) {
  return request<ProfileDetail>(`/profiles/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteProfile(id: string) {
  return request<{ ok: boolean }>(`/profiles/${id}`, { method: "DELETE" });
}

export type CompanyList = {
  items: CompanyDetail[];
  total: number;
  page: number;
  pageSize: number;
};

export function listCompanies(
  q: string,
  page: number | null = 1,
  limit?: number | null,
) {
  const params = new URLSearchParams();
  appendListParams(params, q, page, limit);
  return request<CompanyList>(`/companies?${params.toString()}`);
}

export function getCompany(id: string) {
  return request<CompanyDetail>(`/companies/${id}`);
}

export function createCompany(payload: CompanyWritePayload) {
  return request<CompanyDetail>("/companies", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateCompany(id: string, payload: CompanyWritePayload) {
  return request<CompanyDetail>(`/companies/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteCompany(id: string) {
  return request<{ ok: boolean }>(`/companies/${id}`, { method: "DELETE" });
}

export type ExperienceList = {
  items: ExperienceDetail[];
  total: number;
  page: number;
  pageSize: number;
};

export function listExperiences(
  q: string,
  page: number | null = 1,
  limit?: number | null,
) {
  const params = new URLSearchParams();
  appendListParams(params, q, page, limit);
  return request<ExperienceList>(`/experiences?${params.toString()}`);
}

export function getExperience(id: string) {
  return request<ExperienceDetail>(`/experiences/${id}`);
}

export function createExperience(payload: ExperienceWritePayload) {
  return request<ExperienceDetail>("/experiences", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateExperience(id: string, payload: ExperienceWritePayload) {
  return request<ExperienceDetail>(`/experiences/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteExperience(id: string) {
  return request<{ ok: boolean }>(`/experiences/${id}`, { method: "DELETE" });
}

export type AiVerdictUsage = {
  inputToken: number;
  outputToken: number;
  input: string;
  output: string;
};

export type AiVerdictResult = {
  markdown: string;
  usage: AiVerdictUsage;
  tokenUsed: number;
};

export type AiUsageSummary = {
  tokenUsed: number;
};

export type AiUsageListItem = {
  id: string;
  generationId: string | null;
  generationPublicId: string | null;
  aiProvider: string;
  modelName: string;
  generateType: string;
  inputToken: number;
  outputToken: number;
  createdAt: string;
};

export type AiUsageList = {
  items: AiUsageListItem[];
  total: number;
  page: number;
  pageSize: number;
};

export type AiUsageGroupItem = {
  generationId: string | null;
  generationPublicId: string | null;
  callCount: number;
  inputToken: number;
  outputToken: number;
  tokenUsed: number;
  latestCreatedAt: string;
};

export type AiUsageGroupList = {
  items: AiUsageGroupItem[];
  total: number;
  page: number;
  pageSize: number;
};

export type AiUsageDetail = AiUsageListItem & {
  input: string;
  output: string;
};

export function runAiVerdict(
  jobDescription: string,
  generationId?: string | null,
) {
  return request<AiVerdictResult>("/ai-verdict", {
    method: "POST",
    body: JSON.stringify({
      jobDescription,
      ...(generationId ? { generationId } : {}),
    }),
    timeoutMs: AI_API_TIMEOUT_MS,
  });
}

export type AiResumeRequest = {
  jobContext: string;
  combine: CombineSnapshot;
};

export type AiResumeResult = {
  resume: import("@johel/resume").GeneratedResume;
  usage: AiVerdictUsage;
  tokenUsed: number;
};

export function runAiResume(
  payload: AiResumeRequest & GenerationScopedRequest,
) {
  return request<AiResumeResult>("/ai-resume", {
    method: "POST",
    body: JSON.stringify(payload),
    timeoutMs: AI_API_TIMEOUT_MS,
  });
}

export type AiEvaluateRequest = {
  jobContext: string;
  resume: import("@johel/resume").GeneratedResume;
};

export type AiEvaluateResult = {
  markdown: string;
  usage: AiVerdictUsage;
  tokenUsed: number;
};

export function runAiEvaluate(
  payload: AiEvaluateRequest & GenerationScopedRequest,
) {
  return request<AiEvaluateResult>("/ai-evaluate", {
    method: "POST",
    body: JSON.stringify(payload),
    timeoutMs: AI_API_TIMEOUT_MS,
  });
}

export type GenerationStatus = "in_progress" | "completed";

export type GenerationStartResult = {
  id: string;
  publicId: string;
};

export type GenerationListItem = {
  id: string;
  publicId: string;
  status: GenerationStatus;
  inputToken: number;
  outputToken: number;
  tokenUsed: number;
  createdAt: string;
};

export type GenerationList = {
  items: GenerationListItem[];
  total: number;
  page: number;
  pageSize: number;
};

export type GenerationDetail = {
  id: string;
  publicId: string;
  status: GenerationStatus;
  inputToken: number;
  outputToken: number;
  tokenUsed: number;
  activeStep: string;
  job: GenerateJobState;
  combine: CombineSnapshot;
  verdictMarkdown: string | null;
  resume: import("@johel/resume").GeneratedResume | null;
  evaluationMarkdown: string | null;
  doVerdict: boolean;
  doEvaluate: boolean;
  resumeLanguage: ResumeLanguage;
  verdictPrompt: string;
  generatePrompt: string;
  evaluatePrompt: string;
  createdAt: string;
  updatedAt: string;
};

export type GenerationUpdatePayload = {
  activeStep: string;
  job: GenerateJobState;
  combine: CombineSnapshot;
  verdictMarkdown?: string | null;
  resume?: import("@johel/resume").GeneratedResume | null;
  evaluationMarkdown?: string | null;
  status?: GenerationStatus;
};

export function startGeneration() {
  return request<GenerationStartResult>("/generations/start", {
    method: "POST",
  });
}

export function updateGeneration(id: string, payload: GenerationUpdatePayload) {
  return request<GenerationDetail>(`/generations/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function listGenerations(q: string, page: number | null = 1) {
  const params = new URLSearchParams();
  appendListParams(params, q, page);
  return request<GenerationList>(`/generations?${params.toString()}`);
}

export function getGeneration(publicId: string) {
  return request<GenerationDetail>(`/generations/${publicId}`);
}

export type ExperienceAdvisePlacement =
  | "create_experience"
  | "update_experience"
  | "need_more_facts";

export type ExperienceAdviseDraft = {
  category: string | null;
  problem: string | null;
  actions: string | null;
  outcome: string | null;
};

export type ExperienceAdviseOperation = {
  placement: ExperienceAdvisePlacement;
  rationale: string;
  targetExperienceId: string | null;
  draft: ExperienceAdviseDraft;
  warnings: string[];
};

export type ExperienceAdviseResult = {
  rationale: string;
  questions: string[];
  operations: ExperienceAdviseOperation[];
};

export type ExperienceAdviseRequest = {
  targetExperienceId?: string;
  userFacts: string;
};

export type ExperienceAdviseApiResult = {
  result: ExperienceAdviseResult;
  workspaceFingerprint: string;
  usage: AiVerdictUsage;
  tokenUsed: number;
};

export type ExperienceAdviseApplyOperation = {
  placement: "create_experience" | "update_experience";
  targetExperienceId: string | null;
  draft: ExperienceAdviseDraft;
};

export type ExperienceAdviseApplyRequest = {
  workspaceFingerprint: string;
  operations: ExperienceAdviseApplyOperation[];
};

export type ExperienceAdviseApplyResult = {
  ok: boolean;
  experienceIds: string[];
  warnings: string[];
};

export function runExperienceAdvise(payload: ExperienceAdviseRequest) {
  return request<ExperienceAdviseApiResult>("/ai-experience-advise", {
    method: "POST",
    body: JSON.stringify(payload),
    timeoutMs: AI_API_TIMEOUT_MS,
  });
}

export function applyExperienceAdvise(payload: ExperienceAdviseApplyRequest) {
  return request<ExperienceAdviseApplyResult>("/ai-experience-advise/apply", {
    method: "POST",
    body: JSON.stringify(payload),
    timeoutMs: AI_API_TIMEOUT_MS,
  });
}

export function getAiUsageSummary() {
  return request<AiUsageSummary>("/ai-usage/summary");
}

export function listAiUsageGroups(page = 1) {
  const params = new URLSearchParams();
  params.set("page", String(page));
  return request<AiUsageGroupList>(`/ai-usage/groups?${params.toString()}`);
}

export function listAiUsage(
  page = 1,
  options?: { generationId?: string | null; limit?: number | null },
) {
  const params = new URLSearchParams();
  params.set("page", String(page));
  if (options?.generationId === null) {
    params.set("generationId", "none");
  } else if (options?.generationId) {
    params.set("generationId", options.generationId);
  }
  if (options?.limit === null) {
    params.set("limit", "null");
  } else if (options?.limit != null) {
    params.set("limit", String(options.limit));
  }
  return request<AiUsageList>(`/ai-usage?${params.toString()}`);
}

export function getAiUsage(id: string) {
  return request<AiUsageDetail>(`/ai-usage/${id}`);
}

export async function downloadResumeDocx(
  resume: import("@johel/resume").GeneratedResume,
  runLabel?: string,
): Promise<{ blob?: Blob; fileName?: string; error?: string; status: number }> {
  try {
    const res = await fetch("/backend/resume/docx", {
      method: "POST",
      credentials: "include",
      signal: AbortSignal.timeout(API_TIMEOUT_MS),
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resume, runLabel }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      return {
        status: res.status,
        error:
          body && typeof body === "object" && "error" in body && body.error
            ? String(body.error)
            : "DOCX download failed.",
      };
    }

    const blob = await res.blob();
    const disposition = res.headers.get("Content-Disposition") ?? "";
    const match = disposition.match(/filename="([^"]+)"/);
    const fileName = match?.[1] ?? "resume.docx";
    return { status: res.status, blob, fileName };
  } catch (error) {
    const timedOut =
      error instanceof Error &&
      (error.name === "TimeoutError" || error.name === "AbortError");
    return {
      status: timedOut ? 504 : 0,
      error: timedOut
        ? "Request timed out. Please try again."
        : "DOCX download failed.",
    };
  }
}
