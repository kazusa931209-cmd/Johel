import type {
  WorkflowDetail,
  WorkflowWritePayload,
} from "./workflow";
import type { ProfileDetail, ProfileWritePayload } from "./profile";
import type { CompanyDetail, CompanyWritePayload } from "./company";

export type {
  WorkflowDetail,
  WorkflowLanguage,
  WorkflowMetadataItem,
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

async function request<T>(
  path: string,
  init?: RequestInit,
): Promise<{ data?: T; error?: string; status: number }> {
  const res = await fetch(`/backend${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (res.status === 204) {
    return { status: res.status };
  }

  const body = await parseJson<T & ApiError>(res).catch(() => null);
  if (!res.ok) {
    return {
      status: res.status,
      error: body && "error" in body && body.error ? body.error : "Request failed",
    };
  }

  return { status: res.status, data: body as T };
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

export type AiSettings = {
  provider: "cursor" | null;
  apiKeyMasked: string | null;
};

export function getSettings() {
  return request<AiSettings>("/settings");
}

export function saveSettings(provider: "cursor", apiKey: string) {
  return request<AiSettings>("/settings", {
    method: "PUT",
    body: JSON.stringify({ provider, apiKey }),
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

export function listWorkflows(q: string, page: number) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  params.set("page", String(page));
  return request<WorkflowList>(`/workflows?${params.toString()}`);
}

export function getWorkflow(id: string) {
  return request<WorkflowDetail>(`/workflows/${id}`);
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

export function listProfiles(q: string, page: number) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  params.set("page", String(page));
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

export function listCompanies(q: string, page: number) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  params.set("page", String(page));
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
