"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { WorkflowForm } from "@/components/WorkflowForm";
import { useToast } from "@/components/ToastProvider";
import { getWorkflow, type WorkflowDetail } from "@/lib/api";

export default function EditWorkflowPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const [workflow, setWorkflow] = useState<WorkflowDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getWorkflow(params.id).then((res) => {
      if (cancelled) return;
      if (res.error || !res.data) {
        toast(res.error ?? "Failed to load workflow", "error");
        router.replace("/workflows");
        return;
      }
      setWorkflow(res.data);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [params.id, router, toast]);

  if (loading || !workflow) {
    return (
      <main className="flex min-h-[40vh] items-center justify-center text-sm text-muted">
        Loading…
      </main>
    );
  }

  return (
    <WorkflowForm mode="edit" workflowId={workflow.id} initial={workflow} />
  );
}
