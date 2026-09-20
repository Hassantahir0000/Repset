"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { activateMembership, renewMembership } from "@/features/memberships/actions";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetBody,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/form-field";
import { formatMoney } from "@/lib/format";
import { cn } from "cn";

type Plan = {
  id: string;
  name: string;
  durationDays: number;
  price: string;
  registrationFee: string;
};

/**
 * Sells a term to the member. When they already hold an open membership
 * this renews it (carrying the existing plan forward unless another is
 * picked); otherwise it activates their first one. Both paths raise an
 * invoice, so the drawer shows what will be billed either way.
 */
export function RenewMembershipSheet({
  memberId,
  currentMembership,
  plans,
  currency,
  trigger,
}: {
  memberId: string;
  currentMembership: { id: string; planId: string; planName: string } | null;
  plans: Plan[];
  currency: string;
  trigger: React.ReactNode;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [planId, setPlanId] = useState(currentMembership?.planId ?? plans[0]?.id ?? "");
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10));

  const selectedPlan = plans.find((p) => p.id === planId) ?? null;
  const isRenewal = currentMembership !== null;

  // A renewal continues an existing relationship, so only the plan price is
  // charged; joining for the first time also carries the registration fee.
  const dueToday = selectedPlan
    ? Number(selectedPlan.price) + (isRenewal ? 0 : Number(selectedPlan.registrationFee))
    : 0;

  function onOpenChange(next: boolean) {
    setOpen(next);
    if (next) {
      setError(null);
      setPlanId(currentMembership?.planId ?? plans[0]?.id ?? "");
      setStartDate(new Date().toISOString().slice(0, 10));
    }
  }

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const result = currentMembership
        ? await renewMembership({ membershipId: currentMembership.id, planId })
        : await activateMembership({
            memberId,
            planId,
            startDate: new Date(startDate).toISOString(),
          });

      if (!result.success) {
        setError(result.error);
        return;
      }
      setOpen(false);
      toast.success(isRenewal ? "Membership renewed" : "Membership activated");
      router.refresh();
    });
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <div>
            <SheetTitle>{isRenewal ? "Renew membership" : "Sell a membership"}</SheetTitle>
            <SheetDescription>
              {isRenewal
                ? `Currently on ${currentMembership.planName}`
                : "This member has no open membership"}
            </SheetDescription>
          </div>
          <SheetClose asChild>
            <Button variant="outline" size="icon" aria-label="Close">
              ✕
            </Button>
          </SheetClose>
        </SheetHeader>

        <SheetBody>
          {plans.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No active plans yet. Add one under Memberships first.
            </p>
          )}

          {plans.length > 0 && (
            <div>
              <div className="font-mono text-[10px] tracking-[0.08em] text-muted-foreground uppercase">
                Plan
              </div>
              <div className="mt-2 flex flex-col gap-2">
                {plans.map((plan) => (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() => setPlanId(plan.id)}
                    className={cn(
                      "flex items-center justify-between gap-3 rounded-xl border px-3.5 py-3 text-left",
                      plan.id === planId
                        ? "border-primary bg-[#FDF1EE]"
                        : "border-border bg-card hover:border-foreground",
                    )}
                  >
                    <span className="min-w-0">
                      <span className="block text-[13.5px] font-semibold">{plan.name}</span>
                      <span className="block text-xs text-muted-foreground">
                        {plan.durationDays} days
                        {plan.id === currentMembership?.planId ? " · current plan" : ""}
                      </span>
                    </span>
                    <span className="flex-none font-mono text-[13px]">
                      {formatMoney(currency, Number(plan.price))}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {!isRenewal && selectedPlan && (
            <FormField label="Start date">
              {(id) => (
                <Input
                  id={id}
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              )}
            </FormField>
          )}

          {isRenewal && (
            <p className="text-[13px] text-muted-foreground">
              The new term starts when the current one ends, so no time is lost.
            </p>
          )}

          {selectedPlan && (
            <div className="rounded-xl border border-border bg-muted/40 p-4 text-[13.5px]">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Plan</span>
                <span className="font-semibold">
                  {formatMoney(currency, Number(selectedPlan.price))}
                </span>
              </div>
              {!isRenewal && (
                <div className="mt-2 flex justify-between">
                  <span className="text-muted-foreground">Registration fee</span>
                  <span className="font-semibold">
                    {formatMoney(currency, Number(selectedPlan.registrationFee))}
                  </span>
                </div>
              )}
              <div className="mt-2.5 flex justify-between border-t border-dashed border-border pt-2.5 text-sm">
                <span>Invoiced</span>
                <span className="font-bold">{formatMoney(currency, dueToday)}</span>
              </div>
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}
        </SheetBody>

        <SheetFooter>
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => setOpen(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button className="flex-2" disabled={isPending || !planId} onClick={handleSave}>
            {isRenewal ? "Renew membership" : "Activate membership"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
