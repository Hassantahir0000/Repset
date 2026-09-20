"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { updateBranch } from "@/features/branches/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function BranchRow({
  branch,
}: {
  branch: { id: string; name: string; address: string | null; phone: string | null; isActive: boolean };
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function toggleActive() {
    setError(null);
    startTransition(async () => {
      const result = await updateBranch(branch.id, { isActive: !branch.isActive });
      if (!result.success) {
        setError(result.error);
        return;
      }
      toast.success(branch.isActive ? "Branch deactivated" : "Branch activated");
      router.refresh();
    });
  }

  return (
    <li className="flex items-center justify-between px-4.5 py-3">
      <div>
        <p className="text-sm font-medium">{branch.name}</p>
        <p className="text-xs text-muted-foreground">
          {[branch.address, branch.phone].filter(Boolean).join(" · ") || "No address/phone on file"}
        </p>
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
      <div className="flex items-center gap-3">
        <Badge variant={branch.isActive ? "success" : "secondary"}>
          {branch.isActive ? "Active" : "Inactive"}
        </Badge>
        <Button variant="ghost" size="sm" onClick={toggleActive} disabled={isPending}>
          {branch.isActive ? "Deactivate" : "Activate"}
        </Button>
      </div>
    </li>
  );
}
