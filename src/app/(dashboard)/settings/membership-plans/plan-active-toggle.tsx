"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { updatePlan } from "@/features/membership-plans/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function PlanActiveToggle({ planId, isActive }: { planId: string; isActive: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function toggle() {
    setError(null);
    startTransition(async () => {
      const result = await updatePlan(planId, { isActive: !isActive });
      if (!result.success) {
        setError(result.error);
        return;
      }
      toast.success(isActive ? "Plan deactivated" : "Plan activated");
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-3">
      <Badge variant={isActive ? "success" : "secondary"}>{isActive ? "Active" : "Inactive"}</Badge>
      <Button variant="ghost" size="sm" onClick={toggle} disabled={isPending}>
        {isActive ? "Deactivate" : "Activate"}
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
