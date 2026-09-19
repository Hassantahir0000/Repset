import { describe, it, expect } from "vitest";
import {
  computeLineAmount,
  computeInvoiceTotals,
  computeBalance,
  computeInvoiceStatus,
  canRecordPayment,
  canCancelInvoice,
} from "@/features/billing/logic";

describe("money math (integer-cents, avoids float drift)", () => {
  it("computeLineAmount multiplies unit price by quantity without float drift", () => {
    // 19.99 * 3 in naive floating point is 59.97000000000001
    expect(computeLineAmount({ quantity: 3, unitPrice: 19.99 })).toBe(59.97);
  });

  it("computeInvoiceTotals sums line items exactly for classic float-unsafe values", () => {
    // 0.1 + 0.2 !== 0.3 in naive float arithmetic
    const { subtotal } = computeInvoiceTotals([
      { quantity: 1, unitPrice: 0.1 },
      { quantity: 1, unitPrice: 0.2 },
    ]);
    expect(subtotal).toBe(0.3);
  });

  it("computeInvoiceTotals applies tax and discount on top of the item subtotal", () => {
    const { subtotal, totalAmount } = computeInvoiceTotals(
      [{ quantity: 1, unitPrice: 5000 }],
      500, // tax
      1000, // discount
    );
    expect(subtotal).toBe(5000);
    expect(totalAmount).toBe(4500);
  });

  it("computeInvoiceTotals never lets totalAmount go negative when discount exceeds subtotal+tax", () => {
    const { totalAmount } = computeInvoiceTotals([{ quantity: 1, unitPrice: 100 }], 0, 500);
    expect(totalAmount).toBe(0);
  });

  it("computeInvoiceTotals handles multiple line items with mixed quantities", () => {
    const { subtotal, totalAmount } = computeInvoiceTotals([
      { quantity: 2, unitPrice: 149.5 },
      { quantity: 1, unitPrice: 30 },
    ]);
    expect(subtotal).toBe(329);
    expect(totalAmount).toBe(329);
  });

  it("computeBalance returns the outstanding amount and never goes negative", () => {
    expect(computeBalance(5000, 2000)).toBe(3000);
    expect(computeBalance(5000, 5000)).toBe(0);
    expect(computeBalance(5000, 6000)).toBe(0); // overpayment shouldn't produce a negative balance
  });

  it("computeBalance is exact for a classic float-unsafe partial payment", () => {
    // 100 - 33.33 - 33.33 - 33.34 should be exactly 0, not 1e-14 or similar
    const afterFirst = computeBalance(100, 33.33);
    expect(afterFirst).toBe(66.67);
  });
});

describe("computeInvoiceStatus", () => {
  const dueDate = new Date("2026-06-15T00:00:00.000Z");
  const beforeDue = new Date("2026-06-10T00:00:00.000Z");
  const afterDue = new Date("2026-06-20T00:00:00.000Z");

  it("returns PAID once amountPaid reaches totalAmount, regardless of due date", () => {
    expect(computeInvoiceStatus(5000, 5000, dueDate, afterDue)).toBe("PAID");
  });

  it("returns PAID for a zero-total invoice (nothing owed)", () => {
    expect(computeInvoiceStatus(0, 0, dueDate, beforeDue)).toBe("PAID");
  });

  it("returns ISSUED when nothing has been paid and it isn't overdue yet", () => {
    expect(computeInvoiceStatus(5000, 0, dueDate, beforeDue)).toBe("ISSUED");
  });

  it("returns PARTIALLY_PAID when some but not all has been paid, before the due date", () => {
    expect(computeInvoiceStatus(5000, 2000, dueDate, beforeDue)).toBe("PARTIALLY_PAID");
  });

  it("returns OVERDUE once the due date has passed and it isn't fully paid", () => {
    expect(computeInvoiceStatus(5000, 0, dueDate, afterDue)).toBe("OVERDUE");
    expect(computeInvoiceStatus(5000, 2000, dueDate, afterDue)).toBe("OVERDUE");
  });
});

describe("invoice action guards", () => {
  it("payments can be recorded against ISSUED, PARTIALLY_PAID, or OVERDUE invoices", () => {
    expect(canRecordPayment("ISSUED")).toBe(true);
    expect(canRecordPayment("PARTIALLY_PAID")).toBe(true);
    expect(canRecordPayment("OVERDUE")).toBe(true);
    expect(canRecordPayment("PAID")).toBe(false);
    expect(canRecordPayment("CANCELLED")).toBe(false);
    expect(canRecordPayment("DRAFT")).toBe(false);
  });

  it("an invoice can be cancelled unless it is already PAID or CANCELLED", () => {
    expect(canCancelInvoice("DRAFT")).toBe(true);
    expect(canCancelInvoice("ISSUED")).toBe(true);
    expect(canCancelInvoice("PARTIALLY_PAID")).toBe(true);
    expect(canCancelInvoice("OVERDUE")).toBe(true);
    expect(canCancelInvoice("PAID")).toBe(false);
    expect(canCancelInvoice("CANCELLED")).toBe(false);
  });
});
