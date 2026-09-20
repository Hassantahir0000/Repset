"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createMember } from "@/features/members/actions";
import { activateMembership } from "@/features/memberships/actions";
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

type Branch = { id: string; name: string };
type Plan = {
  id: string;
  name: string;
  durationDays: number;
  price: string;
  registrationFee: string;
};

const STEP_NAMES = ["Who they are", "Plan", "Confirm"] as const;

export function AddMemberSheet({
  branches,
  plans,
  currency,
}: {
  branches: Branch[];
  plans: Plan[];
  currency: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [branchId, setBranchId] = useState(branches[0]?.id ?? "");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [planId, setPlanId] = useState<string | null>(null);
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10));

  const selectedPlan = plans.find((p) => p.id === planId) ?? null;
  const dueToday = selectedPlan
    ? Number(selectedPlan.price) + Number(selectedPlan.registrationFee)
    : 0;
  const canContinueFromStep1 = firstName.trim() && lastName.trim() && phone.trim() && branchId;

  function reset() {
    setStep(1);
    setError(null);
    setFirstName("");
    setLastName("");
    setPhone("");
    setEmail("");
    setPlanId(null);
    setBranchId(branches[0]?.id ?? "");
    setStartDate(new Date().toISOString().slice(0, 10));
  }

  function onOpenChange(next: boolean) {
    setOpen(next);
    if (next) reset();
  }

  async function handleCreate() {
    setIsSaving(true);
    setError(null);

    const created = await createMember({ branchId, firstName, lastName, phone, email });
    if (!created.success) {
      setIsSaving(false);
      setError(created.error);
      return;
    }

    // The plan is optional: a member created without one is a perfectly
    // valid record, so a failure here reports back rather than rolling the
    // member creation back — the plan can still be sold from their profile.
    if (planId) {
      const sold = await activateMembership({
        memberId: created.data.id,
        planId,
        startDate: new Date(startDate).toISOString(),
      });
      if (!sold.success) {
        setIsSaving(false);
        setOpen(false);
        toast.warning(`${firstName} added, but the plan could not be sold: ${sold.error}`);
        router.push(`/members/${created.data.id}`);
        return;
      }
    }

    setIsSaving(false);
    setOpen(false);
    toast.success(`${firstName} ${lastName} added`);
    router.push(`/members/${created.data.id}`);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button>+ Add member</Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <div>
            <SheetTitle>Add member</SheetTitle>
            <SheetDescription>
              Step {step} of 3 · {STEP_NAMES[step - 1]}
            </SheetDescription>
          </div>
          <SheetClose asChild>
            <Button variant="outline" size="icon" aria-label="Close">
              ✕
            </Button>
          </SheetClose>
        </SheetHeader>

        <div className="flex flex-none gap-1.5 px-5 pt-4">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className={cn("h-1 flex-1 rounded-full", step >= n ? "bg-primary" : "bg-secondary")}
            />
          ))}
        </div>

        <SheetBody>
          {error && (
            <div className="rounded-xl border border-[#F5CFC5] bg-[#FDF1EE] px-3.5 py-2.5 text-[13px] text-[#C23B22]">
              {error}
            </div>
          )}

          {step === 1 && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="First name">
                  {(id) => (
                    <Input
                      id={id}
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Hassan"
                    />
                  )}
                </FormField>
                <FormField label="Last name">
                  {(id) => (
                    <Input
                      id={id}
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Ahmed"
                    />
                  )}
                </FormField>
              </div>
              <FormField label="Phone">
                {(id) => (
                  <Input
                    id={id}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0300 1234567"
                  />
                )}
              </FormField>
              <FormField label="Email (optional)">
                {(id) => (
                  <Input
                    id={id}
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="hassan@example.com"
                  />
                )}
              </FormField>
              <FormField label="Branch">
                {(id) => (
                  <select
                    id={id}
                    value={branchId}
                    onChange={(e) => setBranchId(e.target.value)}
                    className="h-9 w-full rounded-lg border border-border bg-card px-3 text-sm outline-none focus:border-foreground"
                  >
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                )}
              </FormField>
            </>
          )}

          {step === 2 && (
            <>
              <div className="font-mono text-[10px] tracking-[0.08em] text-muted-foreground uppercase">
                Choose a plan
              </div>
              <div className="flex flex-col gap-2">
                {plans.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No active plans yet. You can add the member now and sell them a plan later.
                  </p>
                )}
                {plans.map((plan) => (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() => setPlanId(plan.id === planId ? null : plan.id)}
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
                      </span>
                    </span>
                    <span className="flex-none font-mono text-[13px]">
                      {formatMoney(currency, Number(plan.price))}
                    </span>
                  </button>
                ))}
              </div>
              {selectedPlan && (
                <>
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
                  <div className="rounded-xl border border-border bg-muted/40 p-4">
                    <Row label="Plan" value={formatMoney(currency, Number(selectedPlan.price))} />
                    <Row
                      label="Registration fee"
                      value={formatMoney(currency, Number(selectedPlan.registrationFee))}
                      className="mt-2"
                    />
                    <div className="mt-2.5 flex justify-between border-t border-dashed border-border pt-2.5 text-sm">
                      <span>Due today</span>
                      <span className="font-bold">{formatMoney(currency, dueToday)}</span>
                    </div>
                  </div>
                </>
              )}
            </>
          )}

          {step === 3 && (
            <div className="rounded-xl border border-border bg-muted/40 p-4">
              <Row label="Name" value={`${firstName} ${lastName}`.trim() || "Not set"} />
              <Row label="Phone" value={phone || "Not set"} className="mt-2" />
              <Row
                label="Branch"
                value={branches.find((b) => b.id === branchId)?.name ?? "Not set"}
                className="mt-2"
              />
              <Row label="Plan" value={selectedPlan?.name ?? "No plan yet"} className="mt-2" />
              <div className="mt-2.5 flex justify-between border-t border-dashed border-border pt-2.5 text-sm">
                <span>Collect now</span>
                <span className="font-bold">{formatMoney(currency, dueToday)}</span>
              </div>
            </div>
          )}
        </SheetBody>

        <SheetFooter>
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => (step === 1 ? setOpen(false) : setStep(step - 1))}
            disabled={isSaving}
          >
            {step === 1 ? "Cancel" : "Back"}
          </Button>
          <Button
            className="flex-2"
            disabled={isSaving || (step === 1 && !canContinueFromStep1)}
            onClick={() => (step === 3 ? handleCreate() : setStep(step + 1))}
          >
            {step === 3 ? (isSaving ? "Creating…" : "Create member") : "Continue"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function Row({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={cn("flex justify-between gap-3 text-[13.5px]", className)}>
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}
