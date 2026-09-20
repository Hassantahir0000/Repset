import { toBarHeights } from "@/features/dashboard/logic";
import { cn } from "cn";

/**
 * A single-series trend sparkline. One hue throughout with the most recent
 * bucket in the accent — the emphasis encodes recency, not magnitude, so it
 * stays readable when every bar is the same height. Values are exposed on
 * hover rather than printed on every bar.
 */
export function BarSeries({
  values,
  labels,
  formatValue,
  tone = "light",
  className,
}: {
  values: number[];
  labels: string[];
  formatValue?: (value: number) => string;
  tone?: "light" | "dark";
  className?: string;
}) {
  const heights = toBarHeights(values);
  const format = formatValue ?? ((v: number) => String(v));

  return (
    <div className={cn("flex items-end gap-1", className)} role="img" aria-label="Trend">
      {heights.map((height, i) => {
        const empty = values[i] === 0;
        return (
          <div
            key={labels[i]}
            title={`${labels[i]}: ${format(values[i])}`}
            className="flex h-full flex-1 items-end"
          >
            <div
              className={cn(
                "w-full rounded-[3px]",
                i === heights.length - 1 && !empty
                  ? "bg-primary"
                  : tone === "dark"
                    ? "bg-[#45454E]"
                    : "bg-[#C9C7C0]",
                empty && (tone === "dark" ? "bg-[#33333B]" : "bg-[#E0DED8]"),
              )}
              style={{ height: empty ? "3px" : `${Math.max(height, 10)}%` }}
            />
          </div>
        );
      })}
    </div>
  );
}
