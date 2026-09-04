"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ExperienceForm } from "@/components/ExperienceForm";
import { useToast } from "@/components/app/ToastProvider";
import { getExperience, type ExperienceDetail } from "@/lib/api";

export default function EditExperiencePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const [experience, setExperience] = useState<ExperienceDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getExperience(params.id).then((res) => {
      if (cancelled) return;
      if (res.error || !res.data) {
        toast(res.error ?? "Failed to load experience", "error");
        router.replace("/experiences");
        return;
      }
      setExperience(res.data);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [params.id, router, toast]);

  if (loading || !experience) {
    return (
      <main className="flex min-h-[40vh] items-center justify-center text-sm text-muted">
        Loading…
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
