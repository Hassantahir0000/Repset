"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createPlan } from "@/features/membership-plans/actions";
import { FormField } from "@/components/form-field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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

export function NewPlanForm({
  branches,
  currency,
}: {
  branches: { id: string; name: string }[];
  currency: string;
}) {
  const router = useRouter();
  const [form, setForm] = useState({
    branchId: "",
    name: "",
    durationType: "MONTHLY",
    durationDays: "30",
    price: "",
    registrationFee: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    toast.success("Plan added");
    setForm({ branchId: "", name: "", durationType: "MONTHLY", durationDays: "30", price: "", registrationFee: "" });
    router.refresh();
  }

  return (
    <Card>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Plan name">
            {(id) => (
              <Input
                id={id}
                required
                placeholder="e.g. Monthly, Annual VIP"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            )}
          </FormField>

          <FormField label="Branch">
            {() => (
              <Select value={form.branchId || "ALL"} onValueChange={(v) => setForm((f) => ({ ...f, branchId: v === "ALL" ? "" : v }))}>
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

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Adding..." : "Add plan"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
