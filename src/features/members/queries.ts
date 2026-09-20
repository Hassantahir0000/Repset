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

export type MemberActivityKind = "CHECK_IN" | "PAYMENT" | "MEMBERSHIP";

export type MemberActivity = {
  id: string;
  kind: MemberActivityKind;
  at: Date;
  summary: string;
};

/**
 * A single timeline for the member profile, merged from the events we
 * actually record: check-ins, payments and membership terms. There is no
 * audit log table, so this is assembled from those three sources rather
 * than read from one — each is capped before merging so a member with
 * thousands of check-ins can't crowd the other kinds out.
 */
export async function listMemberActivity(memberId: string, limit = 8): Promise<MemberActivity[]> {
  const ctx = await getTenantContext();
  const db = tenantDb(ctx);

  const [attendances, payments, memberships] = await Promise.all([
    db.attendance.findMany({
      where: { memberId },
      orderBy: { checkInAt: "desc" },
      take: limit,
      select: { id: true, checkInAt: true },
    }),
    db.payment.findMany({
      where: { memberId },
      orderBy: { paidAt: "desc" },
      take: limit,
      select: { id: true, paidAt: true, amount: true, method: true },
    }),
    db.membership.findMany({
      where: { memberId },
      orderBy: { startDate: "desc" },
      take: limit,
      select: { id: true, startDate: true, status: true, plan: { select: { name: true } } },
    }),
  ]);

  const events: MemberActivity[] = [
    ...attendances.map((a) => ({
      id: `attendance-${a.id}`,
      kind: "CHECK_IN" as const,
      at: a.checkInAt,
      summary: `Checked in at ${a.checkInAt.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      })}`,
    })),
    ...payments.map((p) => ({
      id: `payment-${p.id}`,
      kind: "PAYMENT" as const,
      at: p.paidAt,
      summary: `Payment received — ${Number(p.amount).toLocaleString("en-US")} (${p.method
        .replace("_", " ")
        .toLowerCase()})`,
    })),
    ...memberships.map((m) => ({
      id: `membership-${m.id}`,
      kind: "MEMBERSHIP" as const,
      at: m.startDate,
      summary: `${m.plan.name} membership started`,
    })),
  ];

  return events.sort((a, b) => b.at.getTime() - a.at.getTime()).slice(0, limit);
}
