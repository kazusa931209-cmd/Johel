"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { CompanyForm } from "@/components/CompanyForm";
import { useToast } from "@/components/app/ToastProvider";
import { getCompany, type CompanyDetail } from "@/lib/api";

export default function EditCompanyPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const [company, setCompany] = useState<CompanyDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getCompany(params.id).then((res) => {
      if (cancelled) return;
      if (res.error || !res.data) {
        toast(res.error ?? "Failed to load company", "error");
        router.replace("/companies");
        return;
      }
      setCompany(res.data);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [params.id, router, toast]);

  if (loading || !company) {
    return (
      <main className="flex min-h-[40vh] items-center justify-center text-sm text-muted">
        Loading…
      </main>
    );
  }

  return (
    <CompanyForm mode="edit" companyId={company.id} initial={company} />
  );
}
