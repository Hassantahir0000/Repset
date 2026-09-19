"use client";

import { useState, type FormEvent } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createOrganizationWithOwner } from "@/features/organizations/actions";
import { FormField } from "@/components/form-field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

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
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <div className="mx-auto mb-3 h-8 w-8 rounded-lg bg-primary shadow-[0_6px_18px_-6px_rgba(232,70,42,0.8)]" />
          <h1 className="text-2xl font-bold tracking-tight">Create your gym</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sets up your organization, first branch, and owner account
          </p>
        </div>

        <Card>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <FormField label="Gym / organization name">
                {(id) => (
                  <Input id={id} required value={form.organizationName} onChange={update("organizationName")} />
                )}
              </FormField>
              <FormField label="First branch name">
                {(id) => <Input id={id} required value={form.branchName} onChange={update("branchName")} />}
              </FormField>
              <FormField label="Your name">
                {(id) => <Input id={id} required value={form.ownerName} onChange={update("ownerName")} />}
              </FormField>
              <FormField label="Email">
                {(id) => (
                  <Input id={id} type="email" required value={form.ownerEmail} onChange={update("ownerEmail")} />
                )}
              </FormField>
              <FormField label="Password">
                {(id) => (
                  <Input
                    id={id}
                    type="password"
                    required
                    value={form.ownerPassword}
                    onChange={update("ownerPassword")}
                  />
                )}
              </FormField>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create organization"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
