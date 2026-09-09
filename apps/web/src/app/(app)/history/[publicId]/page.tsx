"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function HistoryDetailRedirectPage() {
  const params = useParams<{ publicId: string }>();
  const router = useRouter();

  useEffect(() => {
    router.replace(
      `/history?publicId=${encodeURIComponent(params.publicId)}`,
    );
  }, [params.publicId, router]);

  return null;
}
