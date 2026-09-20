"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { recordPayment, cancelInvoice } from "@/features/billing/actions";
import { canRecordPayment, canCancelInvoice } from "@/features/billing/logic";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/form-field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { InvoiceStatus, PaymentMethod } from "@/generated/prisma/enums";

type PaymentItem = {
  id: string;
  amount: string;
  method: PaymentMethod;
  receiptNumber: string;
  paidAt: string;
};

export function PaymentPanel({
  invoiceId,
  status,
  balance,
  currency,
  payments,
}: {
  invoiceId: string;
  status: InvoiceStatus;
  balance: number;
  currency: string;
  payments: PaymentItem[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [amount, setAmount] = useState(String(balance));
  const [method, setMethod] = useState<PaymentMethod>("CASH");
  const [notes, setNotes] = useState("");

  function handleRecordPayment() {
    setError(null);
    startTransition(async () => {
      const result = await recordPayment({ invoiceId, amount: Number(amount), method, notes });
      if (!result.success) {
        setError(result.error);
        return;
      }
      toast.success(`${currency} ${amount} recorded — receipt ${result.data.receiptNumber}`);
      router.refresh();
    });
  }

  function handleCancel() {
    setError(null);
    startTransition(async () => {
      const result = await cancelInvoice(invoiceId);
      if (!result.success) {
        setError(result.error);
        return;
      }
      toast.success("Invoice cancelled");
      router.refresh();
    });
  }

  return (
    <div className="space-y-5">
      {canRecordPayment(status) && (
        <Card>
          <CardContent className="space-y-3">
            <div className="text-[14.5px] font-semibold">Record payment</div>
            <FormField label={`Amount (${currency})`}>
              {(id) => (
                <Input
                  id={id}
                  type="number"
                  min={0}
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              )}
            </FormField>
            <FormField label="Method">
              {() => (
                <Select value={method} onValueChange={(v) => setMethod(v as PaymentMethod)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CASH">Cash</SelectItem>
                    <SelectItem value="CARD">Card</SelectItem>
                    <SelectItem value="BANK_TRANSFER">Bank transfer</SelectItem>
                    <SelectItem value="ONLINE">Online</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </FormField>
            <FormField label="Notes (optional)">
              {(id) => <Input id={id} value={notes} onChange={(e) => setNotes(e.target.value)} />}
            </FormField>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex items-center gap-2">
              <Button disabled={isPending} onClick={handleRecordPayment}>
                Record payment
              </Button>
              {canCancelInvoice(status) && (
                <Button variant="ghost" disabled={isPending} onClick={handleCancel}>
                  Cancel invoice
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_1px_2px_rgba(20,20,26,0.03)]">
        <div className="border-b border-border px-4.5 py-3 text-[14.5px] font-semibold">Payments</div>
        {payments.length === 0 ? (
          <p className="px-4.5 py-6 text-center text-sm text-muted-foreground">No payments recorded yet.</p>
        ) : (
          <ul className="divide-y divide-border">
            {payments.map((p) => (
              <li key={p.id} className="flex items-center justify-between px-4.5 py-3 text-sm">
                <div>
                  <div className="font-mono text-xs text-muted-foreground">{p.receiptNumber}</div>
                  <div className="text-muted-foreground">
                    {new Date(p.paidAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })} &middot;{" "}
                    {p.method.replace("_", " ").toLowerCase()}
                  </div>
                </div>
                <div className="font-medium">
                  {currency} {p.amount}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
