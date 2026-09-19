import { z } from "zod";

const lineItemSchema = z.object({
  description: z.string().trim().min(1).max(200),
  quantity: z.coerce.number().int().min(1).default(1),
  unitPrice: z.coerce.number().min(0),
});

export const createInvoiceSchema = z.object({
  memberId: z.string().min(1),
  items: z.array(lineItemSchema).min(1),
  taxAmount: z.coerce.number().min(0).optional(),
  discountAmount: z.coerce.number().min(0).optional(),
  dueDate: z.string().trim().optional().or(z.literal("")),
});
export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;

export const recordPaymentSchema = z.object({
  invoiceId: z.string().min(1),
  amount: z.coerce.number().positive(),
  method: z.enum(["CASH", "CARD", "BANK_TRANSFER", "ONLINE", "OTHER"]),
  notes: z.string().trim().max(300).optional().or(z.literal("")),
});
export type RecordPaymentInput = z.infer<typeof recordPaymentSchema>;
