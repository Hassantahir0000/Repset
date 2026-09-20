import { startOfDay, trailingDayBuckets } from "@/features/dashboard/logic";
import { cn } from "cn";

/**
 * Binary visit calendar for the trailing `days` days — a filled cell means
 * the member trained that day. Two steps of one hue rather than a gradient,
 * since the underlying value is yes/no; exact dates come from the per-cell
 * tooltip rather than axis labels, which wouldn't fit at this size.
 */
export function AttendanceHeatmap({
  checkIns,
  days = 30,
  className,
}: {
  checkIns: Date[];
  days?: number;
  className?: string;
}) {
  const visited = new Set(checkIns.map((d) => startOfDay(d).getTime()));
  const cells = trailingDayBuckets(days);

  return (
    <div className={cn("grid grid-cols-15 gap-1.5", className)}>
      {cells.map((day) => {
        const didVisit = visited.has(day.getTime());
        const label = day.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        return (
          <div
            key={day.getTime()}
            title={`${label}: ${didVisit ? "visited" : "no visit"}`}
            className={cn(
              "aspect-square rounded-[4px]",
              didVisit ? "bg-primary" : "bg-secondary",
            )}
          />
        );
      })}
    </div>
  );
}
