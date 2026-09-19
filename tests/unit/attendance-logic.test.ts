import { describe, it, expect } from "vitest";
import { canCheckIn } from "@/features/attendance/logic";

const NOW = new Date("2026-06-15T12:00:00.000Z");
const FUTURE = new Date("2026-07-15T00:00:00.000Z");
const PAST = new Date("2026-06-01T00:00:00.000Z");

describe("canCheckIn", () => {
  it("allows a member with an ACTIVE, unexpired membership and no open attendance", () => {
    const result = canCheckIn({
      memberStatus: "ACTIVE",
      membership: { status: "ACTIVE", endDate: FUTURE },
      hasOpenAttendance: false,
      now: NOW,
    });
    expect(result.allowed).toBe(true);
  });

  it("denies when the member record itself isn't ACTIVE", () => {
    const result = canCheckIn({
      memberStatus: "INACTIVE",
      membership: { status: "ACTIVE", endDate: FUTURE },
      hasOpenAttendance: false,
      now: NOW,
    });
    expect(result).toEqual({ allowed: false, reason: "Member record is inactive" });
  });

  it("denies when there is no membership on file", () => {
    const result = canCheckIn({
      memberStatus: "ACTIVE",
      membership: null,
      hasOpenAttendance: false,
      now: NOW,
    });
    expect(result).toEqual({ allowed: false, reason: "No membership on file" });
  });

  it("denies when the membership is frozen", () => {
    const result = canCheckIn({
      memberStatus: "ACTIVE",
      membership: { status: "FROZEN", endDate: FUTURE },
      hasOpenAttendance: false,
      now: NOW,
    });
    expect(result).toEqual({ allowed: false, reason: "Membership is frozen" });
  });

  it("denies when the membership status is PENDING, EXPIRED, or CANCELLED", () => {
    for (const status of ["PENDING", "EXPIRED", "CANCELLED"] as const) {
      const result = canCheckIn({
        memberStatus: "ACTIVE",
        membership: { status, endDate: FUTURE },
        hasOpenAttendance: false,
        now: NOW,
      });
      expect(result).toEqual({ allowed: false, reason: `Membership is ${status.toLowerCase()}` });
    }
  });

  it("denies a membership flagged ACTIVE but past its endDate (lazy expiry)", () => {
    const result = canCheckIn({
      memberStatus: "ACTIVE",
      membership: { status: "ACTIVE", endDate: PAST },
      hasOpenAttendance: false,
      now: NOW,
    });
    expect(result).toEqual({ allowed: false, reason: "Membership has expired" });
  });

  it("denies a second check-in without a checkout in between", () => {
    const result = canCheckIn({
      memberStatus: "ACTIVE",
      membership: { status: "ACTIVE", endDate: FUTURE },
      hasOpenAttendance: true,
      now: NOW,
    });
    expect(result).toEqual({ allowed: false, reason: "Already checked in" });
  });

  it("defaults `now` to the current time when omitted", () => {
    const result = canCheckIn({
      memberStatus: "ACTIVE",
      membership: { status: "ACTIVE", endDate: new Date(Date.now() + 60_000) },
      hasOpenAttendance: false,
    });
    expect(result.allowed).toBe(true);
  });
});
