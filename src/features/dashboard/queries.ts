import { getTenantContext } from "@/lib/tenant";
import { tenantDb } from "@/lib/prisma";
import { sumMoney, computeBalance } from "@/features/billing/logic";
import {
  bucketByDay,
  formatHourRange,
  peakHour,
  percentDelta,
  periodRange,
  startOfDay,
  trailingDayBuckets,
  type DashboardPeriod,
} from "./logic";

const REVENUE_TREND_DAYS = 7;
const CHECK_IN_TREND_DAYS = 10;
const EXPIRY_HORIZON_DAYS = 14;

export type RevenueSummary = {
  total: number;
  deltaPercent: number | null;
  trend: number[];
};

/** Collections for the selected period, how that compares with the previous
 * period of the same length, and a trailing daily series for the sparkline. */
export async function getRevenueSummary(period: DashboardPeriod): Promise<RevenueSummary> {
  const ctx = await getTenantContext();
  const db = tenantDb(ctx);
  const { start, end, previousStart, previousEnd } = periodRange(period);
  const buckets = trailingDayBuckets(REVENUE_TREND_DAYS);

  // One read covering both the comparison window and the sparkline window,
  // then split in memory — cheaper than three separate aggregate queries.
  const earliest = previousStart < buckets[0] ? previousStart : buckets[0];
  const payments = await db.payment.findMany({
    where: { paidAt: { gte: earliest } },
    select: { amount: true, paidAt: true },
  });

  const inRange = (from: Date, to: Date) =>
    payments.filter((p) => p.paidAt >= from && p.paidAt < to).map((p) => Number(p.amount));

  const total = sumMoney(inRange(start, end));
  const previousTotal = sumMoney(inRange(previousStart, previousEnd));

  return {
    total,
    deltaPercent: percentDelta(total, previousTotal),
    trend: bucketByDay(
      payments.map((p) => ({ at: p.paidAt, amount: Number(p.amount) })),
      buckets,
    ),
  };
}

export type CheckInSummary = {
  total: number;
  currentlyIn: number;
  trend: number[];
  peakLabel: string | null;
};

/** Check-in counts for the period, who is still on the floor, and a trailing
 * daily series plus today's busiest hour. */
export async function getCheckInSummary(period: DashboardPeriod): Promise<CheckInSummary> {
  const ctx = await getTenantContext();
  const db = tenantDb(ctx);
  const { start, end } = periodRange(period);
  const buckets = trailingDayBuckets(CHECK_IN_TREND_DAYS);
  const earliest = start < buckets[0] ? start : buckets[0];

  const attendances = await db.attendance.findMany({
    where: { checkInAt: { gte: earliest } },
    select: { checkInAt: true, checkOutAt: true },
  });

  const todayStart = startOfDay(new Date());
  const todayCheckIns = attendances.filter((a) => a.checkInAt >= todayStart);
  const peak = peakHour(todayCheckIns.map((a) => a.checkInAt));

  return {
    total: attendances.filter((a) => a.checkInAt >= start && a.checkInAt <= end).length,
    currentlyIn: todayCheckIns.filter((a) => a.checkOutAt === null).length,
    trend: bucketByDay(
      attendances.map((a) => ({ at: a.checkInAt, amount: 1 })),
      buckets,
    ),
    peakLabel: peak === null ? null : formatHourRange(peak),
  };
}

export type MemberGrowth = {
  active: number;
  total: number;
  joinedThisMonth: number;
};

export async function getMemberGrowth(): Promise<MemberGrowth> {
  const ctx = await getTenantContext();
  const db = tenantDb(ctx);
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

  const [active, total, joinedThisMonth] = await Promise.all([
    db.member.count({ where: { status: "ACTIVE" } }),
    db.member.count(),
    db.member.count({ where: { joinedAt: { gte: monthStart } } }),
  ]);

  return { active, total, joinedThisMonth };
}

export type NeedsAction = {
  expiringCount: number;
  unpaidCount: number;
  unpaidTotal: number;
  total: number;
};

/** The "work the list" bucket: memberships lapsing soon plus invoices still
 * carrying a balance. */
export async function getNeedsAction(): Promise<NeedsAction> {
  const ctx = await getTenantContext();
  const db = tenantDb(ctx);
  const now = new Date();
  const horizon = new Date(now.getTime() + EXPIRY_HORIZON_DAYS * 86_400_000);

  const [expiringCount, openInvoices] = await Promise.all([
    db.membership.count({ where: { status: "ACTIVE", endDate: { gte: now, lte: horizon } } }),
    db.invoice.findMany({
      where: { status: { in: ["ISSUED", "PARTIALLY_PAID", "OVERDUE"] } },
      select: { totalAmount: true, amountPaid: true },
    }),
  ]);

  const unpaidTotal = sumMoney(
    openInvoices.map((inv) => computeBalance(Number(inv.totalAmount), Number(inv.amountPaid))),
  );

  return {
    expiringCount,
    unpaidCount: openInvoices.length,
    unpaidTotal,
    total: expiringCount + openInvoices.length,
  };
}

export type RecentCheckIn = {
  id: string;
  memberId: string;
  memberName: string;
  checkInAt: Date;
  checkOutAt: Date | null;
};

export async function listRecentCheckIns(limit = 5): Promise<RecentCheckIn[]> {
  const ctx = await getTenantContext();
  const db = tenantDb(ctx);
  const rows = await db.attendance.findMany({
    orderBy: { checkInAt: "desc" },
    take: limit,
    include: { member: { select: { firstName: true, lastName: true } } },
  });

  return rows.map((r) => ({
    id: r.id,
    memberId: r.memberId,
    memberName: `${r.member.firstName} ${r.member.lastName}`,
    checkInAt: r.checkInAt,
    checkOutAt: r.checkOutAt,
  }));
}
