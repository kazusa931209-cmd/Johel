"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useToast } from "@/components/app/ToastProvider";

type Paginated<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

type ListFetcher<T> = (
  q: string,
  page: number,
) => Promise<{ data?: Paginated<T>; error?: string }>;

export function usePcewList<T>(fetcher: ListFetcher<T>, loadErrorLabel: string) {
  const { toast } = useToast();
  const [qInput, setQInput] = useState("");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(true);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const load = useCallback(
    async (nextQ: string, nextPage: number) => {
      setLoading(true);
      const res = await fetcher(nextQ, nextPage);
      setLoading(false);
      if (res.error || !res.data) {
        toast(res.error ?? loadErrorLabel, "error");
        return;
      }
      setItems(res.data.items);
      setTotal(res.data.total);
      setPageSize(res.data.pageSize);
      setPage(res.data.page);
    },
    [fetcher, loadErrorLabel, toast],
  );

  useEffect(() => {
    void load(q, page);
  }, [load, q, page]);

  function onFilter(e: FormEvent) {
    e.preventDefault();
    setPage(1);
    setQ(qInput.trim());
  }

  return {
    qInput,
    setQInput,
    page,
    setPage,
    items,
    pageSize,
    loading,
    totalPages,
    onFilter,
  };
}
