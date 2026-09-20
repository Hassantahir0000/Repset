"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { recordPayment } from "@/features/billing/actions";
import { computeBalance } from "@/features/billing/logic";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/form-field";
import { formatMoney } from "@/lib/format";
import { cn } from "cn";
import type { PaymentMethod } from "@/generated/prisma/enums";

export type PayableInvoice = {
  id: string;
  invoiceNumber: string;
  description: string | null;
  balance: number;
};

const METHODS: { value: PaymentMethod; label: string }[] = [
  { value: "CASH", label: "Cash" },
  { value: "CARD", label: "Card" },
  { value: "BANK_TRANSFER", label: "Bank transfer" },
  { value: "ONLINE", label: "Online" },
  { value: "OTHER", label: "Other" },
];

export function TakePaymentSheet({
  invoices,
  currency,
  trigger,
  title = "Take payment",
}: {
  invoices: PayableInvoice[];
  currency: string;
  trigger: React.ReactNode;
  title?: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invoiceId, setInvoiceId] = useState(invoices[0]?.id ?? "");
  const [amount, setAmount] = useState(String(invoices[0]?.balance ?? 0));
  const [method, setMethod] = useState<PaymentMethod>("CASH");
  const [notes, setNotes] = useState("");

  const selected = invoices.find((i) => i.id === invoiceId) ?? null;
  const balance = selected?.balance ?? 0;
  const balanceAfter = computeBalance(balance, Number(amount) || 0);

  // Settling in full is the common case, so it leads; the half is there for
  // the part-payment conversations that actually happen at the desk.
  const quickAmounts = Array.from(
    new Set([balance, Math.round(balance / 2)].filter((v) => v > 0)),
  );

  function onOpenChange(next: boolean) {
    setOpen(next);
    if (next) {
      setError(null);
      setNotes("");
      const first = invoices[0];
      setInvoiceId(first?.id ?? "");
      setAmount(String(first?.balance ?? 0));
    }
  }

  function selectInvoice(id: string) {
    setInvoiceId(id);
    setAmount(String(invoices.find((i) => i.id === id)?.balance ?? 0));
  }

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const result = await recordPayment({
        invoiceId,
        amount: Number(amount),
        method,
        notes,
      });
      if (!result.success) {
        setError(result.error);
        return;
      }
      setOpen(false);
      toast.success(
        `${formatMoney(currency, Number(amount))} recorded — receipt ${result.data.receiptNumber}`,
      );
      router.refresh();
    });
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <div>
            <SheetTitle>{title}</SheetTitle>
            <SheetDescription>
              {formatMoney(currency, balance)} outstanding
              {selected ? ` on ${selected.invoiceNumber}` : ""}
            </SheetDescription>
          </div>
          <SheetClose asChild>
            <Button variant="outline" size="icon" aria-label="Close">
              ✕
            </Button>
          </SheetClose>
        </SheetHeader>

        <SheetBody>
          {invoices.length > 1 && (
            <div>
              <div className="font-mono text-[10px] tracking-[0.08em] text-muted-foreground uppercase">
                Invoice
              </div>
              <div className="mt-2 flex flex-col gap-2">
                {invoices.map((invoice) => (
                  <button
                    key={invoice.id}
                    type="button"
                    onClick={() => selectInvoice(invoice.id)}
                    className={cn(
                      "flex items-center justify-between gap-3 rounded-xl border px-3.5 py-2.5 text-left",
                      invoice.id === invoiceId
                        ? "border-primary bg-[#FDF1EE]"
                        : "border-border bg-card hover:border-foreground",
                    )}
                  >
                    <span className="min-w-0">
                      <span className="block font-mono text-xs">{invoice.invoiceNumber}</span>
                      {invoice.description && (
                        <span className="block truncate text-xs text-muted-foreground">
                          {invoice.description}
                        </span>
                      )}
                    </span>
                    <span className="flex-none text-[13px] font-semibold">
                      {formatMoney(currency, invoice.balance)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

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
              <span className="font-semibold">{formatMoney(currency, Number(amount) || 0)}</span>
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
          <Button className="flex-2" disabled={isPending || !invoiceId} onClick={handleSave}>
            Save payment
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
