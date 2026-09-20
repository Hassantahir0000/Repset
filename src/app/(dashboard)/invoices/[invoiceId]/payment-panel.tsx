"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cancelInvoice } from "@/features/billing/actions";
import { canRecordPayment, canCancelInvoice } from "@/features/billing/logic";
import { Button } from "@/components/ui/button";
import { TakePaymentSheet } from "@/components/take-payment-sheet";
import { formatMoney } from "@/lib/format";
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
  invoiceNumber,
  status,
  balance,
  currency,
  payments,
}: {
  invoiceId: string;
  invoiceNumber: string;
  status: InvoiceStatus;
  balance: number;
  currency: string;
  payments: PaymentItem[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

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
        <div className="flex flex-wrap items-center gap-2">
          <TakePaymentSheet
            invoices={[{ id: invoiceId, invoiceNumber, description: null, balance }]}
            currency={currency}
            title="Record payment"
            trigger={<Button>Record payment</Button>}
          />

          {canCancelInvoice(status) && (
            <Button variant="ghost" disabled={isPending} onClick={handleCancel}>
              Cancel invoice
            </Button>
          )}
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
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
                <div className="font-medium">{formatMoney(currency, Number(p.amount))}</div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
