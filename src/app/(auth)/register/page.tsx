"use client";

import { useState, type FormEvent } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createOrganizationWithOwner } from "@/features/organizations/actions";
import { AuthField, authInputClass } from "@/components/auth-field";

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
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Set up your gym</h1>
      <p className="mt-1.5 text-[13.5px] text-muted-foreground">
        This creates your organization, its first branch and your owner account.
      </p>

      <form onSubmit={handleSubmit} className="mt-5.5 space-y-3.5">
        <AuthField label="Gym name">
          {(id) => (
            <input
              id={id}
              required
              placeholder="Iron House Gym"
              value={form.organizationName}
              onChange={update("organizationName")}
              className={authInputClass}
            />
          )}
        </AuthField>

        <AuthField label="First branch">
          {(id) => (
            <input
              id={id}
              required
              placeholder="Main Branch"
              value={form.branchName}
              onChange={update("branchName")}
              className={authInputClass}
            />
          )}
        </AuthField>

        <AuthField label="Your name">
          {(id) => (
            <input
              id={id}
              required
              autoComplete="name"
              value={form.ownerName}
              onChange={update("ownerName")}
              className={authInputClass}
            />
          )}
        </AuthField>

        <AuthField label="Email">
          {(id) => (
            <input
              id={id}
              type="email"
              required
              autoComplete="email"
              value={form.ownerEmail}
              onChange={update("ownerEmail")}
              className={authInputClass}
            />
          )}
        </AuthField>

        <AuthField label="Password">
          {(id) => (
            <input
              id={id}
              type="password"
              required
              autoComplete="new-password"
              value={form.ownerPassword}
              onChange={update("ownerPassword")}
              className={authInputClass}
            />
          )}
        </AuthField>

        {error && (
          <p className="rounded-xl border border-[#F5CFC5] bg-[#FDF1EE] px-3.5 py-2.5 text-[13px] text-[#C23B22]">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-[12px] bg-primary px-4 py-3.25 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {isSubmitting ? "Creating…" : "Create gym & start trial"}
        </button>

        <p className="text-center text-[13px] text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
}
