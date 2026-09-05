import type {
  WorkflowDetail,
  WorkflowWritePayload,
} from "./workflow";
import type { ProfileDetail, ProfileWritePayload } from "./profile";
import type { CompanyDetail, CompanyWritePayload } from "./company";
import type { ExperienceDetail, ExperienceWritePayload } from "./experience";
import { AI_API_TIMEOUT_MS, API_TIMEOUT_MS } from "./api-timeout";

export type {
  WorkflowDetail,
  WorkflowLanguage,
  WorkflowWritePayload,
} from "./workflow";

export type {
  ProfileDetail,
  ProfileLinkItem,
  ProfileWritePayload,
} from "./profile";

export type {
  CompanyDetail,
  CompanyMetadataItem,
  CompanyWritePayload,
} from "./company";

export type {
  ExperienceDetail,
  ExperienceMetadataItem,
  ExperienceWritePayload,
} from "./experience";

export type User = {
  id: string;
  email: string;
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

export type GenerationProcessSettings = {
  doVerdict: boolean;
  doEvaluate: boolean;
};

export function getGenerationProcess() {
  return request<GenerationProcessSettings>("/settings/process");
}

export function saveGenerationProcess(payload: GenerationProcessSettings) {
  return request<GenerationProcessSettings>("/settings/process", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export type PromptOptimizationSettings = {
  usePromptOptimizationAi: boolean;
};

export function getPromptOptimizationSettings() {
  return request<PromptOptimizationSettings>("/settings/prompt-optimization");
}

export function savePromptOptimizationSettings(
  payload: PromptOptimizationSettings,
) {
  return request<PromptOptimizationSettings>("/settings/prompt-optimization", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export type PromptSettings = {
  verdictPrompt: string;
  generatePrompt: string;
  evaluatePrompt: string;
};

export function getPrompts() {
  return request<PromptSettings>("/prompts");
}

export function savePrompts(payload: PromptSettings) {
  return request<PromptSettings>("/prompts", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export type Workflow = {
  id: string;
  name: string;
  description: string | null;
  used: number;
  createdAt: string;
  updatedAt: string;
};

export type WorkflowList = {
  items: Workflow[];
  total: number;
  page: number;
  pageSize: number;
};

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

export function listWorkflows(
  q: string,
  page: number | null = 1,
  limit?: number | null,
) {
  const params = new URLSearchParams();
  appendListParams(params, q, page, limit);
  return request<WorkflowList>(`/workflows?${params.toString()}`);
}

export function getWorkflow(id: string) {
  return request<WorkflowDetail>(`/workflows/${id}`);
}

export function getWorkflowGenerationFingerprint(workflowId: string) {
  return request<{ fingerprint: string }>(
    `/workflows/${workflowId}/generation-fingerprint`,
  );
}

export function createWorkflow(payload: WorkflowWritePayload) {
  return request<WorkflowDetail>("/workflows", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateWorkflow(id: string, payload: WorkflowWritePayload) {
  return request<WorkflowDetail>(`/workflows/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteWorkflow(id: string) {
  return request<{ ok: boolean }>(`/workflows/${id}`, { method: "DELETE" });
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
  nextPriority: number;
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

export function runAiVerdict(jobDescription: string) {
  return request<AiVerdictResult>("/ai-verdict", {
    method: "POST",
    body: JSON.stringify({ jobDescription }),
    timeoutMs: AI_API_TIMEOUT_MS,
  });
}

export type AiResumeRequest = {
  jobDescription: string;
  acceptedMarkdown: string;
  workflowId: string;
};

export type AiResumeResult = {
  resume: import("@johel/resume").GeneratedResume;
  usage: AiVerdictUsage;
  tokenUsed: number;
};

export function runAiResume(payload: AiResumeRequest) {
  return request<AiResumeResult>("/ai-resume", {
    method: "POST",
    body: JSON.stringify(payload),
    timeoutMs: AI_API_TIMEOUT_MS,
  });
}

export type AiEvaluateRequest = {
  jobDescription: string;
  resume: import("@johel/resume").GeneratedResume;
};

export type AiEvaluateResult = {
  markdown: string;
  usage: AiVerdictUsage;
  tokenUsed: number;
};

export function runAiEvaluate(payload: AiEvaluateRequest) {
  return request<AiEvaluateResult>("/ai-evaluate", {
    method: "POST",
    body: JSON.stringify(payload),
    timeoutMs: AI_API_TIMEOUT_MS,
  });
}

export function getAiUsageSummary() {
  return request<AiUsageSummary>("/ai-usage/summary");
}

export async function downloadResumeDocx(
  resume: import("@johel/resume").GeneratedResume,
  workflowName?: string,
): Promise<{ blob?: Blob; fileName?: string; error?: string; status: number }> {
  try {
    const res = await fetch("/backend/resume/docx", {
      method: "POST",
      credentials: "include",
      signal: AbortSignal.timeout(API_TIMEOUT_MS),
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resume, workflowName }),
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
