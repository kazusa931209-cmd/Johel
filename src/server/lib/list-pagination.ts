const DEFAULT_PAGE_SIZE = 10;

export type ParsedListPagination = {
  skip?: number;
  take?: number;
  page: number;
  pageSize: number;
};

function isNullQueryParam(value: string | undefined) {
  return value === "null" || value === "";
}

export function parseListPagination(
  pageParam: string | undefined,
  limitParam: string | undefined,
  defaultPageSize = DEFAULT_PAGE_SIZE,
): ParsedListPagination {
  if (isNullQueryParam(pageParam) || isNullQueryParam(limitParam)) {
    return { page: 1, pageSize: 0 };
  }

  const page = Math.max(1, Number(pageParam ?? "1") || 1);
  const pageSize = Math.max(1, Number(limitParam ?? defaultPageSize) || defaultPageSize);

  return {
    skip: (page - 1) * pageSize,
    take: pageSize,
    page,
    pageSize,
  };
}

export function listResponsePageSize(
  pagination: ParsedListPagination,
  total: number,
) {
  return pagination.pageSize === 0 ? total : pagination.pageSize;
}
