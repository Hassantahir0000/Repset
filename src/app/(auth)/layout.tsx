const CAPABILITY_TAGS = ["MULTI-BRANCH", "CHECK-IN DESK", "INVOICING"];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="grid min-h-screen grid-cols-1 bg-background lg:grid-cols-2">
      <div className="flex flex-col justify-between gap-7 bg-[#121215] p-10 text-white">
        <div className="flex items-center gap-2.5">
          <div className="h-6.5 w-6.5 rounded-[8px] bg-primary" />
          <span className="text-base font-bold">Repset</span>
        </div>

        <div>
          <div className="text-[clamp(24px,3vw,34px)] font-bold leading-[1.1] tracking-tight">
            Everything your gym does, in one screen.
          </div>
          <p className="mt-3.5 max-w-[380px] text-sm leading-relaxed text-[#9A9AA2]">
            Members, check-ins, payments and renewals — from the front desk to the profit line.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {CAPABILITY_TAGS.map((tag) => (
            <span
              key={tag}
              className="rounded-lg border border-[#26262C] px-3 py-1.75 font-mono text-[11px] text-[#9A9AA2]"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-center p-10">
        <div className="w-full max-w-[380px]">{children}</div>
      </div>
    </main>
  );
}
