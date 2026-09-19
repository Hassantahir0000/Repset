import type { tenantDb, TenantContext } from "@/lib/prisma";
import { computeInvoiceTotals, computeLineAmount } from "@/features/billing/logic";

type Db = ReturnType<typeof tenantDb>;

export function isUniqueConstraintError(err: unknown): boolean {
  return typeof err === "object" && err !== null && "code" in err && err.code === "P2002";
}

async function nextNumber(db: Db, model: "invoice" | "payment", prefix: string): Promise<string> {
  const count = model === "invoice" ? await db.invoice.count() : await db.payment.count();
  return `${prefix}-${String(count + 1).padStart(5, "0")}`;
}

export type InvoiceLineItemInput = {
  description: string;
  quantity: number;
  unitPrice: number;
  membershipId?: string;
};

/**
 * Shared by the standalone `createInvoice` action and the membership
 * activate/renew actions (which generate an invoice as part of the same
 * business operation — "sell a membership" always produces a bill).
 * Not itself a Server Action: callers supply their own tenant-scoped `db`
 * and `ctx` after their own permission checks.
 */
export async function createInvoiceRecord(
  db: Db,
  ctx: TenantContext,
  input: {
    memberId: string;
    branchId: string;
    items: InvoiceLineItemInput[];
    dueDate?: Date;
    taxAmount?: number;
    discountAmount?: number;
  },
) {
  const { subtotal, totalAmount } = computeInvoiceTotals(input.items, input.taxAmount, input.discountAmount);
  const issueDate = new Date();
  const dueDate = input.dueDate ?? issueDate;

  for (let attempt = 0; attempt < 5; attempt++) {
    const invoiceNumber = await nextNumber(db, "invoice", "INV");
    try {
      return await db.invoice.create({
        data: {
          organizationId: ctx.organizationId,
          branchId: input.branchId,
          memberId: input.memberId,
          invoiceNumber,
          status: "ISSUED",
          issueDate,
          dueDate,
          subtotal,
          taxAmount: input.taxAmount ?? 0,
          discountAmount: input.discountAmount ?? 0,
          totalAmount,
          amountPaid: 0,
          items: {
            create: input.items.map((item) => ({
              organizationId: ctx.organizationId,
              branchId: input.branchId,
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              amount: computeLineAmount(item),
              membershipId: item.membershipId,
            })),
          },
        },
        include: { items: true },
      });
    } catch (err) {
      if (isUniqueConstraintError(err) && attempt < 4) continue;
      throw err;
    }
  }
  throw new Error("Could not generate a unique invoice number");
}

export async function generateReceiptNumber(db: Db): Promise<string> {
  return nextNumber(db, "payment", "RCT");
}
