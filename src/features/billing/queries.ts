import { getTenantContext } from "@/lib/tenant";
import { tenantDb } from "@/lib/prisma";
import { computeBalance } from "@/features/billing/logic";

export async function listInvoicesForMember(memberId: string) {
  const ctx = await getTenantContext();
  const db = tenantDb(ctx);
  return db.invoice.findMany({
    where: { memberId },
    orderBy: { issueDate: "desc" },
  });
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
