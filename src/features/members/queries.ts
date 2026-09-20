import { getTenantContext } from "@/lib/tenant";
import { tenantDb } from "@/lib/prisma";
import { computeBalance } from "@/features/billing/logic";
import type { MemberStatus, MembershipStatus } from "@/generated/prisma/enums";

export async function listMembers(search?: string, status?: MemberStatus) {
  const ctx = await getTenantContext();
  const db = tenantDb(ctx);

  const where = {
    ...(status ? { status } : {}),
    ...(search
      ? {
          OR: [
            { firstName: { contains: search, mode: "insensitive" as const } },
            { lastName: { contains: search, mode: "insensitive" as const } },
            { phone: { contains: search } },
            { email: { contains: search, mode: "insensitive" as const } },
            { memberCode: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  return db.member.findMany({
    where,
    include: { branch: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

const OPEN_MEMBERSHIP_STATUSES: MembershipStatus[] = ["PENDING", "ACTIVE", "FROZEN"];
const OPEN_INVOICE_STATUSES = ["ISSUED", "PARTIALLY_PAID", "OVERDUE"] as const;

export type MemberSummary = Awaited<ReturnType<typeof listMembers>>[number] & {
  currentMembership: { planName: string; status: MembershipStatus; endDate: Date } | null;
  outstandingBalance: number;
  lastVisit: Date | null;
};

/**
 * listMembers() plus, per row: current membership (plan + status + expiry),
 * outstanding balance, and last visit — batched across three queries keyed
 * by memberId rather than looked up per row, to avoid N+1s.
 */
export async function listMembersWithSummary(search?: string, status?: MemberStatus): Promise<MemberSummary[]> {
  const ctx = await getTenantContext();
  const db = tenantDb(ctx);
  const members = await listMembers(search, status);
  if (members.length === 0) return [];

  const memberIds = members.map((m) => m.id);

  const [openMemberships, openInvoices, lastVisits] = await Promise.all([
    db.membership.findMany({
      where: { memberId: { in: memberIds }, status: { in: OPEN_MEMBERSHIP_STATUSES } },
      include: { plan: { select: { name: true } } },
      orderBy: { startDate: "desc" },
    }),
    db.invoice.findMany({
      where: { memberId: { in: memberIds }, status: { in: [...OPEN_INVOICE_STATUSES] } },
      select: { memberId: true, totalAmount: true, amountPaid: true },
    }),
    db.attendance.groupBy({
      by: ["memberId"],
      where: { memberId: { in: memberIds } },
      _max: { checkInAt: true },
    }),
  ]);

  const membershipByMember = new Map<string, (typeof openMemberships)[number]>();
  for (const m of openMemberships) {
    if (!membershipByMember.has(m.memberId)) membershipByMember.set(m.memberId, m);
  }

  const balanceByMember = new Map<string, number>();
  for (const inv of openInvoices) {
    const prev = balanceByMember.get(inv.memberId) ?? 0;
    balanceByMember.set(inv.memberId, prev + computeBalance(Number(inv.totalAmount), Number(inv.amountPaid)));
  }

  const lastVisitByMember = new Map(lastVisits.map((v) => [v.memberId, v._max.checkInAt]));

  return members.map((member) => {
    const membership = membershipByMember.get(member.id);
    return {
      ...member,
      currentMembership: membership
        ? { planName: membership.plan.name, status: membership.status, endDate: membership.endDate }
        : null,
      outstandingBalance: balanceByMember.get(member.id) ?? 0,
      lastVisit: lastVisitByMember.get(member.id) ?? null,
    };
  });
}

export async function getMember(memberId: string) {
  const ctx = await getTenantContext();
  const db = tenantDb(ctx);
  return db.member.findFirst({
    where: { id: memberId },
    include: { branch: { select: { id: true, name: true } } },
  });
}

export async function getMemberStatusCounts() {
  const ctx = await getTenantContext();
  const db = tenantDb(ctx);
  const groups = await db.member.groupBy({ by: ["status"], _count: { _all: true } });

  const counts = { ACTIVE: 0, INACTIVE: 0, FROZEN: 0 };
  for (const g of groups) counts[g.status] = g._count._all;
  return { ...counts, total: counts.ACTIVE + counts.INACTIVE + counts.FROZEN };
}

export async function listRecentMembers(limit = 5) {
  const ctx = await getTenantContext();
  const db = tenantDb(ctx);
  return db.member.findMany({
    include: { branch: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}
