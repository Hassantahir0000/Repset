"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createPlan } from "@/features/membership-plans/actions";
import { FormField } from "@/components/form-field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const DURATION_PRESETS: Record<string, number | null> = {
  MONTHLY: 30,
  QUARTERLY: 90,
  ANNUAL: 365,
  CUSTOM: null,
};

const EMPTY_FORM = {
  branchId: "",
  name: "",
  durationType: "MONTHLY",
  durationDays: "30",
  price: "",
  registrationFee: "",
};

export function NewPlanDialog({
  branches,
  currency,
}: {
  branches: { id: string; name: string }[];
  currency: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function onOpenChange(next: boolean) {
    setOpen(next);
    if (next) {
      setForm(EMPTY_FORM);
      setError(null);
    }
  }

  function setDurationType(value: string) {
    const preset = DURATION_PRESETS[value];
    setForm((f) => ({
      ...f,
      durationType: value,
      durationDays: preset !== null ? String(preset) : f.durationDays,
    }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const result = await createPlan({
      branchId: form.branchId,
      name: form.name,
      durationType: form.durationType as "MONTHLY" | "QUARTERLY" | "ANNUAL" | "CUSTOM",
      durationDays: Number(form.durationDays),
      price: Number(form.price),
      registrationFee: form.registrationFee ? Number(form.registrationFee) : undefined,
    });

    setIsSubmitting(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setOpen(false);
    toast.success(`${form.name} added`);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>+ New plan</Button>
      </DialogTrigger>
      <DialogContent>
        {/* The form wraps header-to-footer so the footer's submit button and
            the Enter key both submit it. */}
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-col">
          <DialogHeader>
            <div>
              <DialogTitle>New plan</DialogTitle>
              <DialogDescription>
                Plans are what members buy — a name, a length and a price.
              </DialogDescription>
            </div>
            <DialogClose asChild>
              <Button type="button" variant="outline" size="icon" aria-label="Close">
                ✕
              </Button>
            </DialogClose>
          </DialogHeader>

          <DialogBody>
            <FormField label="Plan name">
              {(id) => (
                <Input
                  id={id}
                  required
                  autoFocus
                  placeholder="e.g. Monthly, Annual VIP"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                />
              )}
            </FormField>

            <FormField label="Branch">
              {() => (
                <Select
                  value={form.branchId || "ALL"}
                  onValueChange={(v) => setForm((f) => ({ ...f, branchId: v === "ALL" ? "" : v }))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All branches</SelectItem>
                    {branches.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </FormField>

            <div className="grid grid-cols-2 gap-3">
              <FormField label="Duration type">
                {() => (
                  <Select value={form.durationType} onValueChange={setDurationType}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MONTHLY">Monthly</SelectItem>
                      <SelectItem value="QUARTERLY">Quarterly</SelectItem>
                      <SelectItem value="ANNUAL">Annual</SelectItem>
                      <SelectItem value="CUSTOM">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </FormField>
              <FormField label="Duration (days)">
                {(id) => (
                  <Input
                    id={id}
                    type="number"
                    min={1}
                    required
                    disabled={form.durationType !== "CUSTOM"}
                    value={form.durationDays}
                    onChange={(e) => setForm((f) => ({ ...f, durationDays: e.target.value }))}
                  />
                )}
              </FormField>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormField label={`Price (${currency})`}>
                {(id) => (
                  <Input
                    id={id}
                    type="number"
                    min={0}
                    step="0.01"
                    required
                    value={form.price}
                    onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                  />
                )}
              </FormField>
              <FormField label="Registration fee (optional)">
                {(id) => (
                  <Input
                    id={id}
                    type="number"
                    min={0}
                    step="0.01"
                    value={form.registrationFee}
                    onChange={(e) => setForm((f) => ({ ...f, registrationFee: e.target.value }))}
                  />
                )}
              </FormField>
            </div>

            {error && (
              <p className="rounded-xl border border-[#F5CFC5] bg-[#FDF1EE] px-3.5 py-2.5 text-[13px] text-[#C23B22]">
                {error}
              </p>
            )}
          </DialogBody>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-2" disabled={isSubmitting}>
              {isSubmitting ? "Adding…" : "Add plan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
