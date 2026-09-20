"use server";

import { getTenantContext } from "@/lib/tenant";
import { tenantDb, type TenantContext } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { canCheckIn } from "@/features/attendance/logic";
import { isExpiredByDate } from "@/features/memberships/logic";
import { computeBalance, sumMoney } from "@/features/billing/logic";
import { checkInSchema, checkInByCodeSchema, type CheckInInput, type CheckInByCodeInput } from "@/features/attendance/schema";
import type { Member } from "@/generated/prisma/client";

export type ActionResult<T> = { success: true; data: T } | { success: false; error: string };

type CheckInDecision =
  | { decision: "allowed"; attendanceId: string; membership: { planName: string; endDate: Date } | null }
  | { decision: "denied"; reason: string; membership: { planName: string; endDate: Date } | null };

async function performCheckIn(
  db: ReturnType<typeof tenantDb>,
  ctx: TenantContext,
  member: Member,
  method: "MANUAL" | "QR",
): Promise<CheckInDecision> {
  const openMembership = await db.membership.findFirst({
    where: { memberId: member.id, status: { in: ["PENDING", "ACTIVE", "FROZEN"] } },
    orderBy: { startDate: "desc" },
    include: { plan: { select: { name: true } } },
  });

  // Lazy expiry: nothing sweeps memberships to EXPIRED on a schedule yet
  // (that's a notifications/cron job, out of MVP scope), so a membership
  // can still say ACTIVE after its endDate has passed. Correct the record
  // the moment it's touched, rather than only denying and leaving it stale.
  if (openMembership?.status === "ACTIVE" && isExpiredByDate(openMembership.endDate)) {
    await db.membership.update({ where: { id: openMembership.id }, data: { status: "EXPIRED" } });
  }

  const hasOpenAttendance = await db.attendance.findFirst({
    where: { memberId: member.id, checkOutAt: null },
  });

  const membership = openMembership
    ? { planName: openMembership.plan.name, endDate: openMembership.endDate }
    : null;

  const gate = canCheckIn({
    memberStatus: member.status,
    membership: openMembership ? { status: openMembership.status, endDate: openMembership.endDate } : null,
    hasOpenAttendance: !!hasOpenAttendance,
  });
  if (!gate.allowed) return { decision: "denied", reason: gate.reason, membership };

  const attendance = await db.attendance.create({
    data: {
      organizationId: ctx.organizationId,
      branchId: member.branchId,
      memberId: member.id,
      method,
    },
  });
  return { decision: "allowed", attendanceId: attendance.id, membership };
}

export async function recordCheckIn(input: CheckInInput): Promise<ActionResult<{ id: string }>> {
  const ctx = await getTenantContext();
  requirePermission(ctx, "attendance:record");

  const parsed = checkInSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const db = tenantDb(ctx);
  const member = await db.member.findFirst({ where: { id: parsed.data.memberId } });
  if (!member) return { success: false, error: "Member not found" };

  const result = await performCheckIn(db, ctx, member, parsed.data.method ?? "MANUAL");
  if (result.decision === "denied") return { success: false, error: result.reason };
  return { success: true, data: { id: result.attendanceId } };
}

/** Check-in "by code" — the flow for a check-in desk scanner. Real QR/barcode
 * scanners at a gym typically act as keyboard-wedge devices: they decode the
 * code and type it (plus Enter) into whatever input is focused, so a plain
 * text field is the actual scanning UI, not a camera view. */
export type CheckInOutcome = {
  decision: "allowed" | "denied";
  reason: string | null;
  member: {
    id: string;
    firstName: string;
    lastName: string;
    memberCode: string;
    photoUrl: string | null;
  };
  membership: { planName: string; endDate: string } | null;
  outstandingBalance: number;
  visitsThisWeek: number;
};

export async function checkInByMemberCode(
  input: CheckInByCodeInput,
): Promise<ActionResult<CheckInOutcome>> {
  const ctx = await getTenantContext();
  requirePermission(ctx, "attendance:record");

  const parsed = checkInByCodeSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const db = tenantDb(ctx);
  const member = await db.member.findFirst({ where: { memberCode: parsed.data.memberCode } });
  if (!member) return { success: false, error: "No member found with that code" };

  const result = await performCheckIn(db, ctx, member, "QR");

  // The desk shows why someone was turned away and what to do about it, so
  // a denial still needs the member's balance and membership alongside it.
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 7);

  const [openInvoices, visitsThisWeek] = await Promise.all([
    db.invoice.findMany({
      where: { memberId: member.id, status: { in: ["ISSUED", "PARTIALLY_PAID", "OVERDUE"] } },
      select: { totalAmount: true, amountPaid: true },
    }),
    db.attendance.count({ where: { memberId: member.id, checkInAt: { gte: weekStart } } }),
  ]);

  return {
    success: true,
    data: {
      decision: result.decision,
      reason: result.decision === "denied" ? result.reason : null,
      member: {
        id: member.id,
        firstName: member.firstName,
        lastName: member.lastName,
        memberCode: member.memberCode,
        photoUrl: member.photoUrl,
      },
      membership: result.membership
        ? { planName: result.membership.planName, endDate: result.membership.endDate.toISOString() }
        : null,
      outstandingBalance: sumMoney(
        openInvoices.map((inv) => computeBalance(Number(inv.totalAmount), Number(inv.amountPaid))),
      ),
      visitsThisWeek,
    },
  };
}

export async function recordCheckOut(attendanceId: string): Promise<ActionResult<{ id: string }>> {
  const ctx = await getTenantContext();
  requirePermission(ctx, "attendance:record");

  const db = tenantDb(ctx);
  const attendance = await db.attendance.findFirst({ where: { id: attendanceId } });
  if (!attendance) return { success: false, error: "Attendance record not found" };
  if (attendance.checkOutAt) return { success: false, error: "Already checked out" };

  const updated = await db.attendance.update({
    where: { id: attendanceId },
    data: { checkOutAt: new Date() },
  });
  return { success: true, data: { id: updated.id } };
}
