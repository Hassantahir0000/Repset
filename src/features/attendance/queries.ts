import { getTenantContext } from "@/lib/tenant";
import { tenantDb } from "@/lib/prisma";

export async function getOpenAttendance(memberId: string) {
  const ctx = await getTenantContext();
  const db = tenantDb(ctx);
  return db.attendance.findFirst({ where: { memberId, checkOutAt: null } });
}

export async function listAttendanceForMember(memberId: string, limit = 10) {
  const ctx = await getTenantContext();
  const db = tenantDb(ctx);
  return db.attendance.findMany({
    where: { memberId },
    orderBy: { checkInAt: "desc" },
    take: limit,
  });
}

/** Check-ins for a member since a cut-off, oldest last — backs the profile
 * attendance heatmap. */
export async function listAttendanceSince(memberId: string, since: Date) {
  const ctx = await getTenantContext();
  const db = tenantDb(ctx);
  return db.attendance.findMany({
    where: { memberId, checkInAt: { gte: since } },
    orderBy: { checkInAt: "desc" },
    select: { id: true, checkInAt: true, checkOutAt: true },
  });
}

export async function listTodayAttendance() {
  const ctx = await getTenantContext();
  const db = tenantDb(ctx);
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  return db.attendance.findMany({
    where: { checkInAt: { gte: startOfDay } },
    include: { member: { select: { firstName: true, lastName: true, memberCode: true } } },
    orderBy: { checkInAt: "desc" },
  });
}

export async function countTodayAttendance() {
  const ctx = await getTenantContext();
  const db = tenantDb(ctx);
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  return db.attendance.count({ where: { checkInAt: { gte: startOfDay } } });
}
