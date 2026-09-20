"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { recordPayment, cancelInvoice } from "@/features/billing/actions";
import { canRecordPayment, canCancelInvoice, computeBalance } from "@/features/billing/logic";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/form-field";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetBody,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import { formatMoney } from "@/lib/format";
import { cn } from "cn";
import type { InvoiceStatus, PaymentMethod } from "@/generated/prisma/enums";

const METHODS: { value: PaymentMethod; label: string }[] = [
  { value: "CASH", label: "Cash" },
  { value: "CARD", label: "Card" },
  { value: "BANK_TRANSFER", label: "Bank transfer" },
  { value: "ONLINE", label: "Online" },
  { value: "OTHER", label: "Other" },
];

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
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(String(balance));
  const [method, setMethod] = useState<PaymentMethod>("CASH");
  const [notes, setNotes] = useState("");

  // Settling in full is the common case, so it leads; the halves are there
  // for the part-payment conversations that actually happen at the desk.
  const quickAmounts = Array.from(
    new Set([balance, Math.round(balance / 2)].filter((v) => v > 0)),
  );

  function onOpenChange(next: boolean) {
    setOpen(next);
    if (next) {
      setError(null);
      setAmount(String(balance));
    }
  }

  function handleRecordPayment() {
    setError(null);
    startTransition(async () => {
      const result = await recordPayment({ invoiceId, amount: Number(amount), method, notes });
      if (!result.success) {
        setError(result.error);
        return;
      }
      setOpen(false);
      setNotes("");
      toast.success(
        `${formatMoney(currency, Number(amount))} recorded — receipt ${result.data.receiptNumber}`,
      );
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

  const balanceAfter = computeBalance(balance, Number(amount) || 0);

  return (
    <div className="space-y-5">
      {canRecordPayment(status) && (
        <div className="flex flex-wrap items-center gap-2">
          <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetTrigger asChild>
              <Button>Record payment</Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <div>
                  <SheetTitle>Record payment</SheetTitle>
                  <SheetDescription>
                    {formatMoney(currency, balance)} outstanding on this invoice
                  </SheetDescription>
                </div>
                <SheetClose asChild>
                  <Button variant="outline" size="icon" aria-label="Close">
                    ✕
                  </Button>
                </SheetClose>
              </SheetHeader>

              <SheetBody>
                <div>
                  <div className="font-mono text-[10px] tracking-[0.08em] text-muted-foreground uppercase">
                    Amount ({currency})
                  </div>
                  <input
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    inputMode="decimal"
                    aria-label={`Amount in ${currency}`}
                    className="mt-2 w-full rounded-xl border border-border bg-muted/40 px-4 py-3.5 text-2xl font-bold tracking-tight outline-none focus:border-foreground focus:bg-card"
                  />
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {quickAmounts.map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setAmount(String(value))}
                        className="rounded-full border border-border px-3 py-1.5 text-[12.5px] hover:border-foreground"
                      >
                        {value.toLocaleString("en-US")}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="font-mono text-[10px] tracking-[0.08em] text-muted-foreground uppercase">
                    Method
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {METHODS.map(({ value, label }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setMethod(value)}
                        className={cn(
                          "rounded-[10px] border px-3 py-2.5 text-[13px] font-semibold",
                          method === value
                            ? "border-foreground bg-foreground text-background"
                            : "border-border bg-card hover:border-foreground",
                        )}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <FormField label="Notes (optional)">
                  {(id) => <Input id={id} value={notes} onChange={(e) => setNotes(e.target.value)} />}
                </FormField>

                <div className="rounded-xl border border-border bg-muted/40 p-4 text-[13.5px]">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Outstanding before</span>
                    <span className="font-semibold">{formatMoney(currency, balance)}</span>
                  </div>
                  <div className="mt-2 flex justify-between">
                    <span className="text-muted-foreground">This payment</span>
                    <span className="font-semibold">
                      {formatMoney(currency, Number(amount) || 0)}
                    </span>
                  </div>
                  <div className="mt-2.5 flex justify-between border-t border-dashed border-border pt-2.5 text-sm">
                    <span>Balance after</span>
                    <span
                      className={cn(
                        "font-bold",
                        balanceAfter === 0 ? "text-[#1F7A4D]" : "text-[#C23B22]",
                      )}
                    >
                      {balanceAfter === 0 ? "Settled" : formatMoney(currency, balanceAfter)}
                    </span>
                  </div>
                </div>

                {error && <p className="text-sm text-destructive">{error}</p>}
              </SheetBody>

              <SheetFooter>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setOpen(false)}
                  disabled={isPending}
                >
                  Cancel
                </Button>
                <Button className="flex-2" disabled={isPending} onClick={handleRecordPayment}>
                  Save payment
                </Button>
              </SheetFooter>
            </SheetContent>
          </Sheet>

          {canCancelInvoice(status) && (
            <Button variant="ghost" disabled={isPending} onClick={handleCancel}>
              Cancel invoice
            </Button>
          )}
          {error && !open && <p className="text-sm text-destructive">{error}</p>}
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
