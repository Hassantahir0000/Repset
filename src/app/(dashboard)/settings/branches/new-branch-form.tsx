"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createBranch } from "@/features/branches/actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function NewBranchForm() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", address: "", phone: "" });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const result = await createBranch(form);

    setIsSubmitting(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    toast.success("Branch added");
    setForm({ name: "", address: "", phone: "" });
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Input
        required
        placeholder="Branch name"
        value={form.name}
        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
      />
      <Input
        placeholder="Address (optional)"
        value={form.address}
        onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
      />
      <Input
        placeholder="Phone (optional)"
        value={form.phone}
        onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
      />

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Adding..." : "Add branch"}
      </Button>
    </form>
  );
}
