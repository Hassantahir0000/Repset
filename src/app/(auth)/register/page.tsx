"use client";

import { useState, type FormEvent } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createOrganizationWithOwner } from "@/features/organizations/actions";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    organizationName: "",
    branchName: "Main Branch",
    ownerName: "",
    ownerEmail: "",
    ownerPassword: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function update(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const result = await createOrganizationWithOwner(form);
    if (!result.success) {
      setError(result.error);
      setIsSubmitting(false);
      return;
    }

    const signInResult = await signIn("credentials", {
      email: form.ownerEmail,
      password: form.ownerPassword,
      redirect: false,
    });

    setIsSubmitting(false);
    if (signInResult?.error) {
      setError("Organization created, but automatic sign-in failed. Please sign in manually.");
      router.push("/login");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-gray-900">Create your gym</h1>
          <p className="mt-1 text-sm text-gray-500">Sets up your organization, first branch, and owner account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Gym / organization name" value={form.organizationName} onChange={update("organizationName")} />
          <Field label="First branch name" value={form.branchName} onChange={update("branchName")} />
          <Field label="Your name" value={form.ownerName} onChange={update("ownerName")} />
          <Field label="Email" type="email" value={form.ownerEmail} onChange={update("ownerEmail")} />
          <Field label="Password" type="password" value={form.ownerPassword} onChange={update("ownerPassword")} />

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-md bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
          >
            {isSubmitting ? "Creating..." : "Create organization"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-gray-900 underline">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <input
        type={type}
        required
        value={value}
        onChange={onChange}
        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
      />
    </div>
  );
}
