import { getTenantContext } from "@/lib/tenant";
import { tenantDb } from "@/lib/prisma";
import { computeBalance, sumMoney } from "@/features/billing/logic";

export async function listInvoicesForMember(memberId: string) {
  const ctx = await getTenantContext();
  const db = tenantDb(ctx);
  return db.invoice.findMany({
    where: { memberId },
    orderBy: { issueDate: "desc" },
  });
}

/** Everything a member has actually paid, across all their invoices. */
export async function getMemberLifetimeValue(memberId: string): Promise<number> {
  const ctx = await getTenantContext();
  const db = tenantDb(ctx);
  const payments = await db.payment.findMany({ where: { memberId }, select: { amount: true } });
  return sumMoney(payments.map((p) => Number(p.amount)));
}

export async function getInvoice(invoiceId: string) {
  const ctx = await getTenantContext();
  const db = tenantDb(ctx);
  return db.invoice.findFirst({
    where: { id: invoiceId },
    include: {
      items: true,
      payments: { orderBy: { paidAt: "desc" } },
      member: { select: { firstName: true, lastName: true, memberCode: true } },
    },
  });
}

export async function listOutstandingInvoices() {
  const ctx = await getTenantContext();
  const db = tenantDb(ctx);
  return db.invoice.findMany({
    where: { status: { in: ["ISSUED", "PARTIALLY_PAID", "OVERDUE"] } },
    include: { member: { select: { firstName: true, lastName: true, memberCode: true } } },
    orderBy: { issueDate: "desc" },
    take: 100,
  });
}

export async function getOutstandingBalanceTotal(): Promise<number> {
  const ctx = await getTenantContext();
  const db = tenantDb(ctx);
  const openInvoices = await db.invoice.findMany({
    where: { status: { in: ["ISSUED", "PARTIALLY_PAID", "OVERDUE"] } },
    select: { totalAmount: true, amountPaid: true },
  });
  return openInvoices.reduce(
    (sum, inv) => sum + computeBalance(Number(inv.totalAmount), Number(inv.amountPaid)),
    0,
  );
}

/** Sum of payments recorded since `since` (defaults to the start of the
 * current calendar month) — the "revenue collected" KPI. */
export async function getCollectedTotal(since?: Date): Promise<number> {
  const ctx = await getTenantContext();
  const db = tenantDb(ctx);
  const startOfMonth = since ?? new Date(new Date().getFullYear(), new Date().getMonth(), 1);

  const payments = await db.payment.findMany({
    where: { paidAt: { gte: startOfMonth } },
    select: { amount: true },
  });
  return payments.reduce((sum, p) => sum + Number(p.amount), 0);
}
