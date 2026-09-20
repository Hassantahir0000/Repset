"use client";

import { useId } from "react";

/** Mono-uppercase labelled field used across the sign-in / sign-up screens. */
export function AuthField({
  label,
  children,
}: {
  label: string;
  children: (id: string) => React.ReactNode;
}) {
  const id = useId();
  return (
    <div>
      <label
        htmlFor={id}
        className="font-mono text-[10px] tracking-[0.08em] text-muted-foreground uppercase"
      >
        {label}
      </label>
      <div className="mt-2">{children(id)}</div>
    </div>
  );
}

export const authInputClass =
  "w-full rounded-[12px] border border-border bg-card px-3.5 py-3.25 text-sm outline-none transition-colors focus:border-foreground";
