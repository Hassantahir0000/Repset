"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateBranch } from "@/features/branches/actions";

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
      router.refresh();
    });
  }

  return (
    <li className="flex items-center justify-between px-4 py-3">
      <div>
        <p className="text-sm font-medium text-gray-900">{branch.name}</p>
        <p className="text-xs text-gray-500">
          {[branch.address, branch.phone].filter(Boolean).join(" · ") || "No address/phone on file"}
        </p>
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
      <div className="flex items-center gap-3">
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
            branch.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
          }`}
        >
          {branch.isActive ? "Active" : "Inactive"}
        </span>
        <button
          onClick={toggleActive}
          disabled={isPending}
          className="text-sm text-gray-500 underline hover:text-gray-900 disabled:opacity-50"
        >
          {branch.isActive ? "Deactivate" : "Activate"}
        </button>
      </div>
    </li>
  );
}
