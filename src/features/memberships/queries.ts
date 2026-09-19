import { getTenantContext } from "@/lib/tenant";
import { tenantDb } from "@/lib/prisma";

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
