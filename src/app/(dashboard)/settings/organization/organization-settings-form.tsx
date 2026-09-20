"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { updateOrganization } from "@/features/organizations/actions";
import { FormField } from "@/components/form-field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function OrganizationSettingsForm({
  organization,
}: {
  organization: { name: string; timezone: string; currency: string };
}) {
  const router = useRouter();
  const [form, setForm] = useState(organization);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const result = await updateOrganization(form);

    setIsSubmitting(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    toast.success("Organization settings saved");
    router.refresh();
  }

  return (
    <Card>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Organization name">
            {(id) => (
              <Input
                id={id}
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            )}
          </FormField>

          <FormField label="Timezone">
            {(id) => (
              <Input
                id={id}
                required
                placeholder="e.g. Asia/Karachi"
                value={form.timezone}
                onChange={(e) => setForm((f) => ({ ...f, timezone: e.target.value }))}
              />
            )}
          </FormField>

          <FormField label="Currency">
            {(id) => (
              <Input
                id={id}
                required
                maxLength={3}
                placeholder="e.g. PKR"
                className="uppercase"
                value={form.currency}
                onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value.toUpperCase() }))}
              />
            )}
          </FormField>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save changes"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
