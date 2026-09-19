"use server";

import { getTenantContext } from "@/lib/tenant";
import { tenantDb } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { createInvoiceSchema, recordPaymentSchema, type CreateInvoiceInput, type RecordPaymentInput } from "@/features/billing/schema";
import { createInvoiceRecord, generateReceiptNumber, isUniqueConstraintError } from "@/features/billing/helpers";
import { canRecordPayment, canCancelInvoice, computeBalance, computeInvoiceStatus } from "@/features/billing/logic";

export type ActionResult<T> = { success: true; data: T } | { success: false; error: string };

export async function createInvoice(input: CreateInvoiceInput): Promise<ActionResult<{ id: string }>> {
  const ctx = await getTenantContext();
  requirePermission(ctx, "billing:manage");

  const parsed = createInvoiceSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const db = tenantDb(ctx);
  const member = await db.member.findFirst({ where: { id: parsed.data.memberId } });
  if (!member) return { success: false, error: "Member not found" };

  const invoice = await createInvoiceRecord(db, ctx, {
    memberId: member.id,
    branchId: member.branchId,
    items: parsed.data.items,
    dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : undefined,
    taxAmount: parsed.data.taxAmount,
    discountAmount: parsed.data.discountAmount,
  });
  return { success: true, data: { id: invoice.id } };
}

export async function recordPayment(
  input: RecordPaymentInput,
): Promise<ActionResult<{ id: string; receiptNumber: string }>> {
  const ctx = await getTenantContext();
  requirePermission(ctx, "billing:manage");

  const parsed = recordPaymentSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { invoiceId, amount, method, notes } = parsed.data;

  const db = tenantDb(ctx);
  const invoice = await db.invoice.findFirst({ where: { id: invoiceId } });
  if (!invoice) return { success: false, error: "Invoice not found" };
  if (!canRecordPayment(invoice.status)) {
    return { success: false, error: `Cannot record a payment against a ${invoice.status.toLowerCase()} invoice` };
  }

  const balance = computeBalance(Number(invoice.totalAmount), Number(invoice.amountPaid));
  if (amount > balance) {
    return { success: false, error: `Payment of ${amount} exceeds the outstanding balance of ${balance}` };
  }

  let payment;
  for (let attempt = 0; attempt < 5; attempt++) {
    const receiptNumber = await generateReceiptNumber(db);
    try {
      payment = await db.payment.create({
        data: {
          organizationId: ctx.organizationId,
          branchId: invoice.branchId,
          invoiceId: invoice.id,
          memberId: invoice.memberId,
          amount,
          method,
          receiptNumber,
          recordedByUserId: ctx.userId,
          notes: notes || undefined,
        },
      });
      break;
    } catch (err) {
      if (isUniqueConstraintError(err) && attempt < 4) continue;
      throw err;
    }
  }
  if (!payment) return { success: false, error: "Could not generate a unique receipt number" };

  const newAmountPaid = Number(invoice.amountPaid) + amount;
  const newStatus = computeInvoiceStatus(Number(invoice.totalAmount), newAmountPaid, invoice.dueDate);
  await db.invoice.update({
    where: { id: invoice.id },
    data: { amountPaid: newAmountPaid, status: newStatus },
  });

  return { success: true, data: { id: payment.id, receiptNumber: payment.receiptNumber } };
}

export async function cancelInvoice(invoiceId: string): Promise<ActionResult<{ id: string }>> {
  const ctx = await getTenantContext();
  requirePermission(ctx, "billing:manage");

  const db = tenantDb(ctx);
  const invoice = await db.invoice.findFirst({ where: { id: invoiceId } });
  if (!invoice) return { success: false, error: "Invoice not found" };
  if (!canCancelInvoice(invoice.status)) {
    return { success: false, error: `Cannot cancel a ${invoice.status.toLowerCase()} invoice` };
  }

  const updated = await db.invoice.update({ where: { id: invoiceId }, data: { status: "CANCELLED" } });
  return { success: true, data: { id: updated.id } };
}
