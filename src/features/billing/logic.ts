import type { InvoiceStatus } from "@/generated/prisma/enums";

// All money math here runs in integer cents rather than floating-point
// dollars. JS numbers can't represent amounts like 19.99 exactly, so
// straightforward float arithmetic on prices drifts (e.g. 0.1 + 0.2 !==
// 0.3) — multiplying to cents and rounding once per input sidesteps that
// entirely, at the cost of not handling sub-cent precision (which no
// currency here needs).
function toCents(amount: number): number {
  return Math.round(amount * 100);
}

function fromCents(cents: number): number {
  return cents / 100;
}

/** Adds money amounts in cents so long lists of prices don't accumulate
 * float drift the way repeated `+` on decimals does. */
export function sumMoney(amounts: number[]): number {
  return fromCents(amounts.reduce((sum, amount) => sum + toCents(amount), 0));
}

export type InvoiceLineInput = { quantity: number; unitPrice: number };

export function computeLineAmount(line: InvoiceLineInput): number {
  return fromCents(toCents(line.unitPrice) * line.quantity);
}

export function computeInvoiceTotals(
  items: InvoiceLineInput[],
  taxAmount = 0,
  discountAmount = 0,
): { subtotal: number; totalAmount: number } {
  const subtotalCents = items.reduce((sum, item) => sum + toCents(item.unitPrice) * item.quantity, 0);
  const totalCents = Math.max(0, subtotalCents + toCents(taxAmount) - toCents(discountAmount));
  return { subtotal: fromCents(subtotalCents), totalAmount: fromCents(totalCents) };
}

export function computeBalance(totalAmount: number, amountPaid: number): number {
  return fromCents(Math.max(0, toCents(totalAmount) - toCents(amountPaid)));
}

/**
 * Derives the invoice's status from its amounts and due date. Does not
 * produce DRAFT or CANCELLED — those are set explicitly by actions, never
 * inferred from totals.
 */
export function computeInvoiceStatus(
  totalAmount: number,
  amountPaid: number,
  dueDate: Date,
  now: Date = new Date(),
): Exclude<InvoiceStatus, "DRAFT" | "CANCELLED"> {
  const totalCents = toCents(totalAmount);
  const paidCents = toCents(amountPaid);

  if (paidCents >= totalCents) return "PAID";
  if (now.getTime() > dueDate.getTime()) return "OVERDUE";
  if (paidCents > 0) return "PARTIALLY_PAID";
  return "ISSUED";
}

const RECORDABLE: InvoiceStatus[] = ["ISSUED", "PARTIALLY_PAID", "OVERDUE"];
const CANCELLABLE: InvoiceStatus[] = ["DRAFT", "ISSUED", "PARTIALLY_PAID", "OVERDUE"];

export function canRecordPayment(status: InvoiceStatus): boolean {
  return RECORDABLE.includes(status);
}

export function canCancelInvoice(status: InvoiceStatus): boolean {
  return CANCELLABLE.includes(status);
}
