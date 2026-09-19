"use server";

import { getTenantContext } from "@/lib/tenant";
import { tenantDb, type TenantContext } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { canCheckIn } from "@/features/attendance/logic";
import { isExpiredByDate } from "@/features/memberships/logic";
import { checkInSchema, checkInByCodeSchema, type CheckInInput, type CheckInByCodeInput } from "@/features/attendance/schema";
import type { Member } from "@/generated/prisma/client";

export type ActionResult<T> = { success: true; data: T } | { success: false; error: string };

async function performCheckIn(
  db: ReturnType<typeof tenantDb>,
  ctx: TenantContext,
  member: Member,
  method: "MANUAL" | "QR",
): Promise<ActionResult<{ id: string }>> {
  const openMembership = await db.membership.findFirst({
    where: { memberId: member.id, status: { in: ["PENDING", "ACTIVE", "FROZEN"] } },
    orderBy: { startDate: "desc" },
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

  const gate = canCheckIn({
    memberStatus: member.status,
    membership: openMembership ? { status: openMembership.status, endDate: openMembership.endDate } : null,
    hasOpenAttendance: !!hasOpenAttendance,
  });
  if (!gate.allowed) return { success: false, error: gate.reason };

  const attendance = await db.attendance.create({
    data: {
      organizationId: ctx.organizationId,
      branchId: member.branchId,
      memberId: member.id,
      method,
    },
  });
  return { success: true, data: { id: attendance.id } };
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

  return performCheckIn(db, ctx, member, parsed.data.method ?? "MANUAL");
}

/** Check-in "by code" — the flow for a check-in desk scanner. Real QR/barcode
 * scanners at a gym typically act as keyboard-wedge devices: they decode the
 * code and type it (plus Enter) into whatever input is focused, so a plain
 * text field is the actual scanning UI, not a camera view. */
export async function checkInByMemberCode(
  input: CheckInByCodeInput,
): Promise<ActionResult<{ id: string; memberName: string }>> {
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
  if (!result.success) return result;
  return { success: true, data: { id: result.data.id, memberName: `${member.firstName} ${member.lastName}` } };
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
