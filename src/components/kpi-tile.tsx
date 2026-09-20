import { cn } from "cn";

export function KpiTile({
  label,
  value,
  hint,
  tone = "default",
  className,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "dark" | "accent";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border p-4",
        tone === "dark" && "border-transparent bg-[#16161A] text-white shadow-[0_1px_2px_rgba(20,20,26,0.06),0_18px_40px_-26px_rgba(20,20,26,0.9)]",
        tone === "accent" && "border-[#F5CFC5] bg-[#FDF1EE]",
        tone === "default" && "border-border bg-card shadow-[0_1px_2px_rgba(20,20,26,0.03)]",
        className,
      )}
    >
      <div
        className={cn(
          "font-mono text-[10px] tracking-[0.08em] uppercase",
          tone === "dark" ? "text-[#8E8E97]" : tone === "accent" ? "text-[#B8492F]" : "text-muted-foreground",
        )}
      >
        {label}
      </div>
      <div
        className={cn(
          "mt-2.5 truncate text-[clamp(18px,2.2vw,28px)] font-bold tracking-tight",
          tone === "accent" && "text-[#C23B22]",
        )}
        title={value}
      >
        {value}
      </div>
      {hint && (
        <div className={cn("mt-1.5 text-[12.5px]", tone === "dark" ? "text-[#8E8E97]" : tone === "accent" ? "text-[#96432C]" : "text-muted-foreground")}>
          {hint}
        </div>
      )}
    </div>
  );
}
