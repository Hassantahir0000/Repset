import { describe, it, expect } from "vitest";
import {
  addDays,
  computeEndDate,
  computeFreezeExtensionDays,
  applyFreezeExtension,
  isExpiredByDate,
  canFreeze,
  canResume,
  canCancel,
  canExpire,
  canRenew,
  membershipProgress,
} from "@/features/memberships/logic";

describe("date math", () => {
  it("addDays adds whole days in milliseconds", () => {
    const start = new Date("2026-01-01T00:00:00.000Z");
    expect(addDays(start, 30).toISOString()).toBe("2026-01-31T00:00:00.000Z");
  });

  it("computeEndDate is startDate + durationDays", () => {
    const start = new Date("2026-01-01T00:00:00.000Z");
    expect(computeEndDate(start, 365).toISOString()).toBe("2027-01-01T00:00:00.000Z");
  });

  it("isExpiredByDate compares against now by default", () => {
    const past = new Date(Date.now() - 1000);
    const future = new Date(Date.now() + 1000 * 60 * 60);
    expect(isExpiredByDate(past)).toBe(true);
    expect(isExpiredByDate(future)).toBe(false);
  });
});

describe("freeze extension math", () => {
  it("credits exactly the frozen duration, rounded up to a full day", () => {
    const frozenAt = new Date("2026-03-01T00:00:00.000Z");
    const resumedAt = new Date("2026-03-11T00:00:00.000Z"); // exactly 10 days
    expect(computeFreezeExtensionDays(frozenAt, resumedAt)).toBe(10);
  });

  it("rounds a partial day up rather than truncating it away", () => {
    const frozenAt = new Date("2026-03-01T00:00:00.000Z");
    const resumedAt = new Date("2026-03-01T12:00:00.000Z"); // 12 hours
    expect(computeFreezeExtensionDays(frozenAt, resumedAt)).toBe(1);
  });

  it("never produces a negative extension if resumedAt precedes frozenAt", () => {
    const frozenAt = new Date("2026-03-11T00:00:00.000Z");
    const resumedAt = new Date("2026-03-01T00:00:00.000Z");
    expect(computeFreezeExtensionDays(frozenAt, resumedAt)).toBe(0);
  });

  it("applyFreezeExtension pushes endDate out by the frozen duration", () => {
    const endDate = new Date("2026-06-01T00:00:00.000Z");
    const frozenAt = new Date("2026-03-01T00:00:00.000Z");
    const resumedAt = new Date("2026-03-15T00:00:00.000Z"); // 14 days frozen
    expect(applyFreezeExtension(endDate, frozenAt, resumedAt).toISOString()).toBe(
      "2026-06-15T00:00:00.000Z",
    );
  });
});

describe("status transition guards", () => {
  it("only an ACTIVE membership can be frozen", () => {
    expect(canFreeze("ACTIVE")).toBe(true);
    for (const s of ["PENDING", "FROZEN", "EXPIRED", "CANCELLED"] as const) {
      expect(canFreeze(s)).toBe(false);
    }
  });

  it("only a FROZEN membership can be resumed", () => {
    expect(canResume("FROZEN")).toBe(true);
    for (const s of ["PENDING", "ACTIVE", "EXPIRED", "CANCELLED"] as const) {
      expect(canResume(s)).toBe(false);
    }
  });

  it("PENDING, ACTIVE, and FROZEN memberships can be cancelled; terminal states cannot", () => {
    expect(canCancel("PENDING")).toBe(true);
    expect(canCancel("ACTIVE")).toBe(true);
    expect(canCancel("FROZEN")).toBe(true);
    expect(canCancel("EXPIRED")).toBe(false);
    expect(canCancel("CANCELLED")).toBe(false);
  });

  it("ACTIVE and FROZEN memberships can be marked expired; PENDING/terminal cannot", () => {
    expect(canExpire("ACTIVE")).toBe(true);
    expect(canExpire("FROZEN")).toBe(true);
    expect(canExpire("PENDING")).toBe(false);
    expect(canExpire("EXPIRED")).toBe(false);
    expect(canExpire("CANCELLED")).toBe(false);
  });

  it("ACTIVE, FROZEN, and EXPIRED memberships can be renewed; PENDING/CANCELLED cannot", () => {
    expect(canRenew("ACTIVE")).toBe(true);
    expect(canRenew("FROZEN")).toBe(true);
    expect(canRenew("EXPIRED")).toBe(true);
    expect(canRenew("PENDING")).toBe(false);
    expect(canRenew("CANCELLED")).toBe(false);
  });
});

describe("membershipProgress", () => {
  const start = new Date("2026-09-01T00:00:00");
  const end = new Date("2026-10-01T00:00:00");

  it("reports how much of the term is used and what is left", () => {
    const { percentUsed, daysLeft } = membershipProgress(start, end, new Date("2026-09-16T00:00:00"));
    expect(percentUsed).toBe(50);
    expect(daysLeft).toBe(15);
  });

  it("clamps a term that has already run out rather than exceeding 100%", () => {
    const { percentUsed, daysLeft } = membershipProgress(start, end, new Date("2026-11-01T00:00:00"));
    expect(percentUsed).toBe(100);
    expect(daysLeft).toBe(0);
  });

  it("clamps a term that has not started yet to zero", () => {
    const { percentUsed } = membershipProgress(start, end, new Date("2026-08-01T00:00:00"));
    expect(percentUsed).toBe(0);
  });

  it("treats a zero-length term as fully used instead of dividing by zero", () => {
    const { percentUsed } = membershipProgress(start, start, new Date("2026-09-01T00:00:00"));
    expect(percentUsed).toBe(100);
  });
});
