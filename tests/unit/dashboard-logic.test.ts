import { describe, it, expect } from "vitest";
import {
  bucketByDay,
  formatHourRange,
  isDashboardPeriod,
  peakHour,
  percentDelta,
  periodRange,
  startOfDay,
  toBarHeights,
  trailingDayBuckets,
} from "@/features/dashboard/logic";
import { sumMoney } from "@/features/billing/logic";

const NOW = new Date("2026-09-20T15:30:00");

describe("periodRange", () => {
  it("covers today from midnight, comparing against yesterday", () => {
    const { start, previousStart, previousEnd } = periodRange("today", NOW);
    expect(start).toEqual(new Date("2026-09-20T00:00:00"));
    expect(previousStart).toEqual(new Date("2026-09-19T00:00:00"));
    expect(previousEnd).toEqual(new Date("2026-09-20T00:00:00"));
  });

  it("covers a trailing 7 days for the week, comparing against the 7 before it", () => {
    const { start, previousStart } = periodRange("week", NOW);
    expect(start).toEqual(new Date("2026-09-14T00:00:00"));
    expect(previousStart).toEqual(new Date("2026-09-07T00:00:00"));
  });

  it("covers the calendar month to date, comparing against the previous month", () => {
    const { start, previousStart, previousEnd } = periodRange("month", NOW);
    expect(start).toEqual(new Date("2026-09-01T00:00:00"));
    expect(previousStart).toEqual(new Date("2026-08-01T00:00:00"));
    expect(previousEnd).toEqual(new Date("2026-09-01T00:00:00"));
  });
});

describe("percentDelta", () => {
  it("reports whole-percent growth", () => {
    expect(percentDelta(120, 100)).toBe(20);
  });

  it("reports decline as a negative", () => {
    expect(percentDelta(80, 100)).toBe(-20);
  });

  it("returns null when there is no previous figure to compare against", () => {
    // Growth "from zero" is unbounded, so the UI shows no delta at all.
    expect(percentDelta(500, 0)).toBeNull();
  });
});

describe("bucketByDay", () => {
  const buckets = trailingDayBuckets(3, NOW);

  it("sums amounts into the day they fall on", () => {
    const totals = bucketByDay(
      [
        { at: new Date("2026-09-18T09:00:00"), amount: 10 },
        { at: new Date("2026-09-18T20:00:00"), amount: 5 },
        { at: new Date("2026-09-20T08:00:00"), amount: 7 },
      ],
      buckets,
    );
    expect(totals).toEqual([15, 0, 7]);
  });

  it("drops entries older than the first bucket instead of folding them in", () => {
    // Otherwise the oldest bar would absorb all history and read as a spike.
    const totals = bucketByDay([{ at: new Date("2026-01-01T09:00:00"), amount: 999 }], buckets);
    expect(totals).toEqual([0, 0, 0]);
  });
});

describe("toBarHeights", () => {
  it("scales the series against its own maximum", () => {
    expect(toBarHeights([5, 10, 0])).toEqual([50, 100, 0]);
  });

  it("returns a flat series when everything is zero rather than dividing by zero", () => {
    expect(toBarHeights([0, 0])).toEqual([0, 0]);
  });
});

describe("peakHour", () => {
  it("finds the busiest hour", () => {
    const peak = peakHour([
      new Date("2026-09-20T19:05:00"),
      new Date("2026-09-20T19:40:00"),
      new Date("2026-09-20T08:00:00"),
    ]);
    expect(peak).toBe(19);
  });

  it("returns null when there is nothing to rank", () => {
    expect(peakHour([])).toBeNull();
  });
});

describe("formatHourRange", () => {
  it("formats an evening hour as a 12-hour range", () => {
    expect(formatHourRange(19)).toBe("7 PM–8 PM");
  });

  it("wraps midnight correctly", () => {
    expect(formatHourRange(23)).toBe("11 PM–12 AM");
  });
});

describe("sumMoney", () => {
  it("adds decimal amounts without float drift", () => {
    // 0.1 + 0.2 === 0.30000000000000004 with naive addition
    expect(sumMoney([0.1, 0.2])).toBe(0.3);
  });

  it("sums an empty list to zero", () => {
    expect(sumMoney([])).toBe(0);
  });
});

describe("helpers", () => {
  it("startOfDay strips the time component", () => {
    expect(startOfDay(NOW)).toEqual(new Date("2026-09-20T00:00:00"));
  });

  it("isDashboardPeriod rejects unknown query values", () => {
    expect(isDashboardPeriod("week")).toBe(true);
    expect(isDashboardPeriod("yesterday")).toBe(false);
    expect(isDashboardPeriod(undefined)).toBe(false);
  });
});
