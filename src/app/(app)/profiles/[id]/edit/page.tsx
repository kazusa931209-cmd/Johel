"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useT } from "@/components/app/LocaleProvider";
import { ProfileForm } from "@/components/ProfileForm";
import { useToast } from "@/components/app/ToastProvider";
import { getProfile, type ProfileDetail } from "@/lib/api";

export default function EditProfilePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const t = useT();
  const { toast } = useToast();
  const [profile, setProfile] = useState<ProfileDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getProfile(params.id).then((res) => {
      if (cancelled) return;
      if (res.error || !res.data) {
        toast(res.error ?? t("toast.profileLoadFailed"), "error");
        router.replace("/profiles");
        return;
      }
      setProfile(res.data);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [params.id, router, t, toast]);

  if (loading || !profile) {
    return (
      <main className="flex min-h-[40vh] items-center justify-center text-sm text-muted">
        {t("crud.common.loading")}
      </main>
    );
  }

  return (
    <ProfileForm mode="edit" profileId={profile.id} initial={profile} />
  );
}
