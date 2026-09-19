import { isExpiredByDate } from "@/features/memberships/logic";
import type { MemberStatus, MembershipStatus } from "@/generated/prisma/enums";

export type CheckInGateInput = {
  memberStatus: MemberStatus;
  membership: { status: MembershipStatus; endDate: Date } | null;
  hasOpenAttendance: boolean;
  now?: Date;
};

export type CheckInGateResult = { allowed: true } | { allowed: false; reason: string };

/**
 * The single source of truth for "can this member walk in right now" —
 * shared by the check-in Server Action and its tests. Mirrors the access
 * rules from the product spec: member record must be in good standing,
 * membership must be active and not expired by date (even if its status
 * field hasn't caught up yet — there's no expiry sweep job in the MVP),
 * and the member can't already be checked in without a checkout.
 */
export function canCheckIn(input: CheckInGateInput): CheckInGateResult {
  const now = input.now ?? new Date();

  if (input.memberStatus !== "ACTIVE") {
    return { allowed: false, reason: `Member record is ${input.memberStatus.toLowerCase()}` };
  }

  if (!input.membership) {
    return { allowed: false, reason: "No membership on file" };
  }

  if (input.membership.status === "FROZEN") {
    return { allowed: false, reason: "Membership is frozen" };
  }

  if (input.membership.status !== "ACTIVE") {
    return { allowed: false, reason: `Membership is ${input.membership.status.toLowerCase()}` };
  }

  if (isExpiredByDate(input.membership.endDate, now)) {
    return { allowed: false, reason: "Membership has expired" };
  }

  if (input.hasOpenAttendance) {
    return { allowed: false, reason: "Already checked in" };
  }

  return { allowed: true };
}
