import { getTenantContext } from "@/lib/tenant";
import { tenantDb } from "@/lib/prisma";
import type { MembershipStatus } from "@/generated/prisma/enums";

/** Org-wide counts of memberships by status, for KPI tiles. */
export async function getMembershipStatusCounts() {
  const ctx = await getTenantContext();
  const db = tenantDb(ctx);
  const groups = await db.membership.groupBy({ by: ["status"], _count: { _all: true } });

  const counts: Record<MembershipStatus, number> = {
    PENDING: 0,
    ACTIVE: 0,
    FROZEN: 0,
    EXPIRED: 0,
    CANCELLED: 0,
  };
  for (const g of groups) counts[g.status] = g._count._all;
  return counts;
}

/** How many currently-open (PENDING/ACTIVE/FROZEN) memberships each plan
 * has, keyed by planId — used on the Membership Plans screen. */
export async function getOpenMembershipCountsByPlan(): Promise<Map<string, number>> {
  const ctx = await getTenantContext();
  const db = tenantDb(ctx);
  const groups = await db.membership.groupBy({
    by: ["planId"],
    where: { status: { in: ["PENDING", "ACTIVE", "FROZEN"] } },
    _count: { _all: true },
  });
  return new Map(groups.map((g) => [g.planId, g._count._all]));
}

export async function listMembershipHistory(memberId: string) {
  const ctx = await getTenantContext();
  const db = tenantDb(ctx);
  return db.membership.findMany({
    where: { memberId },
    include: { plan: { select: { name: true } } },
    orderBy: { startDate: "desc" },
  });
}

/** The membership that best represents the member's "current" state: an
 * open (non-terminal) one if there is exactly one, per the invariant that
 * activate/renew never leaves more than one PENDING/ACTIVE/FROZEN
 * membership open at a time — otherwise the most recently started record. */
export async function getCurrentMembership(memberId: string) {
  const ctx = await getTenantContext();
  const db = tenantDb(ctx);

  const open = await db.membership.findFirst({
    where: { memberId, status: { in: ["PENDING", "ACTIVE", "FROZEN"] } },
    include: { plan: { select: { name: true, durationDays: true } } },
    orderBy: { startDate: "desc" },
  });
  if (open) return open;

  return db.membership.findFirst({
    where: { memberId },
    include: { plan: { select: { name: true, durationDays: true } } },
    orderBy: { startDate: "desc" },
  });
}
