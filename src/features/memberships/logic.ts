import type { MembershipStatus } from "@/generated/prisma/enums";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * MS_PER_DAY);
}

export function computeEndDate(startDate: Date, durationDays: number): Date {
  return addDays(startDate, durationDays);
}

/**
 * A freeze pauses the countdown to expiry: the member gets back, on the
 * far end of their membership, exactly the wall-clock time they spent
 * frozen. Rounds up to a whole day so a partial day of freeze still
 * credits at least one day, rather than being lost to truncation.
 */
export function computeFreezeExtensionDays(frozenAt: Date, resumedAt: Date): number {
  const ms = resumedAt.getTime() - frozenAt.getTime();
  if (ms <= 0) return 0;
  return Math.ceil(ms / MS_PER_DAY);
}

export function applyFreezeExtension(endDate: Date, frozenAt: Date, resumedAt: Date): Date {
  return addDays(endDate, computeFreezeExtensionDays(frozenAt, resumedAt));
}

export function isExpiredByDate(endDate: Date, now: Date = new Date()): boolean {
  return endDate.getTime() < now.getTime();
}

// Status transition guards — the single source of truth for which actions
// are legal from which states, shared by the Server Actions and their tests.
const FREEZABLE: MembershipStatus[] = ["ACTIVE"];
const RESUMABLE: MembershipStatus[] = ["FROZEN"];
const CANCELLABLE: MembershipStatus[] = ["PENDING", "ACTIVE", "FROZEN"];
const EXPIRABLE: MembershipStatus[] = ["ACTIVE", "FROZEN"];
const RENEWABLE: MembershipStatus[] = ["ACTIVE", "FROZEN", "EXPIRED"];

export function canFreeze(status: MembershipStatus): boolean {
  return FREEZABLE.includes(status);
}
export function canResume(status: MembershipStatus): boolean {
  return RESUMABLE.includes(status);
}
export function canCancel(status: MembershipStatus): boolean {
  return CANCELLABLE.includes(status);
}
export function canExpire(status: MembershipStatus): boolean {
  return EXPIRABLE.includes(status);
}
export function canRenew(status: MembershipStatus): boolean {
  return RENEWABLE.includes(status);
}
