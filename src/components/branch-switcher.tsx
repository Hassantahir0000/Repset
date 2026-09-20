"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setBranchFilter } from "@/features/organizations/actions";
import { cn } from "cn";

type Branch = { id: string; name: string };

export function BranchSwitcher({
  branches,
  currentBranchId,
}: {
  branches: Branch[];
  currentBranchId: string | null;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function select(branchId: string | null) {
    startTransition(async () => {
      await setBranchFilter(branchId);
      router.refresh();
    });
  }

  return (
    <div className="flex gap-1 rounded-full bg-secondary p-[3px]">
      <button
        type="button"
        disabled={isPending}
        onClick={() => select(null)}
        className={cn(
          "rounded-full px-3 py-1 text-xs font-semibold transition-colors",
          currentBranchId === null ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
        )}
      >
        All branches
      </button>
      {branches.map((b) => (
        <button
          key={b.id}
          type="button"
          disabled={isPending}
          onClick={() => select(b.id)}
          className={cn(
            "rounded-full px-3 py-1 text-xs font-semibold transition-colors",
            currentBranchId === b.id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {b.name}
        </button>
      ))}
    </div>
  );
}
