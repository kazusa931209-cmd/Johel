"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useT } from "@/components/app/LocaleProvider";
import { ExperienceForm } from "@/components/ExperienceForm";
import { useToast } from "@/components/app/ToastProvider";
import { getExperience, type ExperienceDetail } from "@/lib/api";

export default function EditExperiencePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const t = useT();
  const { toast } = useToast();
  const [experience, setExperience] = useState<ExperienceDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getExperience(params.id).then((res) => {
      if (cancelled) return;
      if (res.error || !res.data) {
        toast(res.error ?? t("toast.experienceLoadFailed"), "error");
        router.replace("/experiences");
        return;
      }
      setExperience(res.data);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [params.id, router, t, toast]);

  if (loading || !experience) {
    return (
      <main className="flex min-h-[40vh] items-center justify-center text-sm text-muted">
        {t("crud.common.loading")}
      </main>
    );
  }

  return (
    <ExperienceForm
      mode="edit"
      experienceId={experience.id}
      initial={experience}
    />
  );
}
