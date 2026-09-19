"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  activateMembership,
  renewMembership,
  freezeMembership,
  resumeMembership,
  cancelMembership,
  expireMembership,
} from "@/features/memberships/actions";
import { canFreeze, canResume, canCancel, canExpire, canRenew } from "@/features/memberships/logic";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { MembershipStatus } from "@/generated/prisma/enums";

type Plan = { id: string; name: string; durationDays: number };

type CurrentMembership = {
  id: string;
  status: MembershipStatus;
  startDate: string;
  endDate: string;
  priceAtPurchase: string;
  plan: { name: string };
} | null;

const STATUS_VARIANT: Record<MembershipStatus, "success" | "info" | "secondary" | "destructive" | "warning"> = {
  ACTIVE: "success",
  FROZEN: "info",
  PENDING: "warning",
  EXPIRED: "secondary",
  CANCELLED: "destructive",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export function MembershipPanel({
  memberId,
  currentMembership,
  plans,
  currency,
}: {
  memberId: string;
  currentMembership: CurrentMembership;
  plans: Plan[];
  currency: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [planId, setPlanId] = useState(plans[0]?.id ?? "");

  const isOpen =
    currentMembership && ["PENDING", "ACTIVE", "FROZEN"].includes(currentMembership.status);

  function run(action: () => Promise<{ success: boolean; error?: string }>) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (!result.success) {
        setError(result.error ?? "Something went wrong");
        return;
      }
      router.refresh();
    });
  }

  return (
    <Card>
      <CardContent className="space-y-4">
        <div className="text-[14.5px] font-semibold">Membership</div>

        {currentMembership && (
          <div className="rounded-xl border border-border bg-muted/40 p-3.5">
            <div className="flex items-center justify-between gap-3">
              <div className="font-medium">{currentMembership.plan.name}</div>
              <Badge variant={STATUS_VARIANT[currentMembership.status]}>{currentMembership.status}</Badge>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2 font-mono text-[11px] text-muted-foreground">
              <div>
                START
                <div className="mt-0.5 text-[13px] font-medium text-foreground">
                  {formatDate(currentMembership.startDate)}
                </div>
              </div>
              <div>
                {currentMembership.status === "ACTIVE" || currentMembership.status === "FROZEN"
                  ? "EXPIRES"
                  : "ENDED"}
                <div className="mt-0.5 text-[13px] font-medium text-foreground">
                  {formatDate(currentMembership.endDate)}
                </div>
              </div>
            </div>
            <div className="mt-2 font-mono text-[11px] text-muted-foreground">
              PAID {currency} {currentMembership.priceAtPurchase}
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {canFreeze(currentMembership.status) && (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isPending}
                  onClick={() => run(() => freezeMembership(currentMembership.id))}
                >
                  Freeze
                </Button>
              )}
              {canResume(currentMembership.status) && (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isPending}
                  onClick={() => run(() => resumeMembership(currentMembership.id))}
                >
                  Resume
                </Button>
              )}
              {canRenew(currentMembership.status) && (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isPending}
                  onClick={() => run(() => renewMembership({ membershipId: currentMembership.id }))}
                >
                  Renew
                </Button>
              )}
              {canCancel(currentMembership.status) && (
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={isPending}
                  onClick={() => run(() => cancelMembership(currentMembership.id))}
                >
                  Cancel
                </Button>
              )}
              {canExpire(currentMembership.status) && (
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={isPending}
                  onClick={() => run(() => expireMembership(currentMembership.id))}
                >
                  Mark expired
                </Button>
              )}
            </div>
          </div>
        )}

        {!isOpen && (
          <div className="space-y-2.5">
            {plans.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No active membership plans yet. Add one under Settings &rarr; Membership Plans.
              </p>
            ) : (
              <>
                <Select value={planId} onValueChange={setPlanId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a plan" />
                  </SelectTrigger>
                  <SelectContent>
                    {plans.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  disabled={isPending || !planId}
                  onClick={() => run(() => activateMembership({ memberId, planId }))}
                >
                  Activate membership
                </Button>
              </>
            )}
          </div>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}
      </CardContent>
    </Card>
  );
}
