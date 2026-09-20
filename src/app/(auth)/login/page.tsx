"use client";

import { useState, type FormEvent } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AuthField, authInputClass } from "@/components/auth-field";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const result = await signIn("credentials", { email, password, redirect: false });

    setIsSubmitting(false);
    if (result?.error) {
      setError("Invalid email or password");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Sign in</h1>
      <p className="mt-1.5 text-[13.5px] text-muted-foreground">
        Use the account your gym owner created for you.
      </p>

      <form onSubmit={handleSubmit} className="mt-5.5 space-y-3.5">
        <AuthField label="Email">
          {(id) => (
            <input
              id={id}
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
          {isSubmitting ? "Signing in…" : "Sign in"}
        </button>

        <p className="text-center text-[13px] text-muted-foreground">
          New gym?{" "}
          <Link href="/register" className="font-semibold text-primary hover:underline">
            Set up your account
          </Link>
        </p>
      </form>
    </div>
  );
}
