"use client";

import {
  listCompanies,
  listExperiences,
  listProfiles,
  type CompanyList,
  type ExperienceList,
  type ProfileList,
} from "@/lib/api";
import { clearPceCache } from "@/lib/pce";

type ListResult<T> = Promise<{
  data?: T;
  error?: string;
  status: number;
}>;

type PaginatedList = {
  items: unknown[];
  total: number;
  page: number;
  pageSize: number;
};

function listCacheKey(q: string, page: number) {
  return `${q}\0${page}`;
}

function createPaginatedListLoader<T extends PaginatedList>(
  fetcher: (q: string, page: number) => ListResult<T>,
) {
  const cache = new Map<string, T>();
  const inflight = new Map<string, ListResult<T>>();

  function load(q: string, page: number): ListResult<T> {
    const key = listCacheKey(q, page);
    const hit = cache.get(key);
    if (hit) {
      return Promise.resolve({ data: hit, status: 200 });
    }

    const pending = inflight.get(key);
    if (pending) {
      return pending;
    }

    const promise = fetcher(q, page).then((res) => {
      inflight.delete(key);
      if (res.data) {
        cache.set(key, res.data);
      }
      return res;
    });
    inflight.set(key, promise);
    return promise;
  }

  function clear() {
    cache.clear();
    inflight.clear();
  }

  return { load, clear };
}

const profileLists = createPaginatedListLoader<ProfileList>((q, page) =>
  listProfiles(q, page),
);
const companyLists = createPaginatedListLoader<CompanyList>((q, page) =>
  listCompanies(q, page),
);
const experienceLists = createPaginatedListLoader<ExperienceList>((q, page) =>
  listExperiences(q, page),
);

export const loadProfileList = profileLists.load;
export const clearProfileListCache = profileLists.clear;

export const loadCompanyList = companyLists.load;
export const clearCompanyListCache = companyLists.clear;

export const loadExperienceList = experienceLists.load;
export const clearExperienceListCache = experienceLists.clear;

export function clearAllCrudListCaches() {
  profileLists.clear();
  companyLists.clear();
  experienceLists.clear();
}

/** Call after profile/company/experience CRUD so list + PCE bundles stay fresh. */
export function invalidateWorkspaceCrudCaches(
  resource: "profiles" | "companies" | "experiences" | "all",
) {
  if (resource === "profiles" || resource === "all") {
    clearProfileListCache();
  }
  if (resource === "companies" || resource === "all") {
    clearCompanyListCache();
  }
  if (resource === "experiences" || resource === "all") {
    clearExperienceListCache();
  }
  clearPceCache();
}
