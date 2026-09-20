export type DashboardPeriod = "today" | "week" | "month";

export const DASHBOARD_PERIODS: DashboardPeriod[] = ["today", "week", "month"];

export function isDashboardPeriod(value: string | undefined): value is DashboardPeriod {
  return value === "today" || value === "week" || value === "month";
}

export function periodLabel(period: DashboardPeriod): string {
  return period === "today" ? "Today" : period === "week" ? "Week" : "Month";
}

export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export type PeriodRange = { start: Date; end: Date; previousStart: Date; previousEnd: Date };

/**
 * The window the dashboard's headline numbers cover, plus the immediately
 * preceding window of the same length so the two can be compared. "week"
 * and "month" are rolling/calendar respectively: a week is the trailing 7
 * days, a month is the calendar month to date (which is what gym owners
 * reconcile against).
 */
export function periodRange(period: DashboardPeriod, now: Date = new Date()): PeriodRange {
  const end = now;

  if (period === "today") {
    const start = startOfDay(now);
    return { start, end, previousStart: addDays(start, -1), previousEnd: start };
  }

  if (period === "week") {
    const start = startOfDay(addDays(now, -6));
    return { start, end, previousStart: addDays(start, -7), previousEnd: start };
  }

  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const previousStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return { start, end, previousStart, previousEnd: start };
}

/**
 * Percent change between two totals, rounded to whole percent. Returns null
 * when the previous total is zero — "up 100%" from nothing is noise, so the
 * UI shows no delta at all in that case.
 */
export function percentDelta(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}

/** Bucket boundaries for a trailing `days`-day series, oldest first. */
export function trailingDayBuckets(days: number, now: Date = new Date()): Date[] {
  const today = startOfDay(now);
  return Array.from({ length: days }, (_, i) => addDays(today, -(days - 1 - i)));
}

/**
 * Distributes timestamped amounts into trailing-day buckets. Anything older
 * than the first bucket is ignored rather than folded into it, so the first
 * bar never reads as an artificial spike.
 */
export function bucketByDay(
  entries: { at: Date; amount: number }[],
  buckets: Date[],
): number[] {
  const totals = new Array<number>(buckets.length).fill(0);
  if (buckets.length === 0) return totals;

  const firstBucketTime = buckets[0].getTime();
  for (const entry of entries) {
    const entryDay = startOfDay(entry.at).getTime();
    if (entryDay < firstBucketTime) continue;
    const index = buckets.findIndex((b) => b.getTime() === entryDay);
    if (index !== -1) totals[index] += entry.amount;
  }
  return totals;
}

/** Scales a series to 0-100 percentage heights for bar rendering. */
export function toBarHeights(series: number[]): number[] {
  const max = Math.max(...series, 0);
  if (max === 0) return series.map(() => 0);
  return series.map((v) => Math.round((v / max) * 100));
}

/** The hour (0-23) with the most entries, or null when there are none. */
export function peakHour(times: Date[]): number | null {
  if (times.length === 0) return null;
  const counts = new Map<number, number>();
  for (const t of times) {
    const hour = t.getHours();
    counts.set(hour, (counts.get(hour) ?? 0) + 1);
  }
  let best: number | null = null;
  let bestCount = 0;
  for (const [hour, count] of counts) {
    if (count > bestCount) {
      best = hour;
      bestCount = count;
    }
  }
  return best;
}

export function formatHourRange(hour: number): string {
  const format = (h: number) => {
    const normalised = ((h % 24) + 24) % 24;
    const suffix = normalised < 12 ? "AM" : "PM";
    const display = normalised % 12 === 0 ? 12 : normalised % 12;
    return `${display} ${suffix}`;
  };
  return `${format(hour)}–${format(hour + 1)}`;
}
