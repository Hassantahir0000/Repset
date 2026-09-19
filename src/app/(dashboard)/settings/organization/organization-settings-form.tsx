"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { updateOrganization } from "@/features/organizations/actions";

export function OrganizationSettingsForm({
  organization,
}: {
  organization: { name: string; timezone: string; currency: string };
}) {
  const router = useRouter();
  const [form, setForm] = useState(organization);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    setIsSubmitting(true);

    const result = await updateOrganization(form);

    setIsSubmitting(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setSaved(true);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-sm space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Organization name</label>
        <input
          type="text"
          required
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Timezone</label>
        <input
          type="text"
          required
          value={form.timezone}
          onChange={(e) => setForm((f) => ({ ...f, timezone: e.target.value }))}
          placeholder="e.g. Asia/Karachi"
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Currency</label>
        <input
          type="text"
          required
          maxLength={3}
          value={form.currency}
          onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value.toUpperCase() }))}
          placeholder="e.g. PKR"
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm uppercase focus:border-gray-900 focus:outline-none"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {saved && !error && <p className="text-sm text-green-600">Saved.</p>}

      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-md bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
      >
        {isSubmitting ? "Saving..." : "Save changes"}
      </button>
    </form>
  );
}
