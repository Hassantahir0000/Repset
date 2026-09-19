import Link from "next/link";
import { InvoiceStatusBadge } from "@/components/invoice-status-badge";
import { computeBalance } from "@/features/billing/logic";
import type { InvoiceStatus } from "@/generated/prisma/enums";

type InvoiceItem = {
  id: string;
  invoiceNumber: string;
  status: InvoiceStatus;
  totalAmount: { toString(): string };
  amountPaid: number;
};

export function BillingPanel({ invoices, currency }: { invoices: InvoiceItem[]; currency: string }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_1px_2px_rgba(20,20,26,0.03)]">
      <div className="border-b border-border px-4.5 py-3 text-[14.5px] font-semibold">Billing</div>
      {invoices.length === 0 ? (
        <p className="px-4.5 py-6 text-center text-sm text-muted-foreground">No invoices yet.</p>
      ) : (
        <ul className="divide-y divide-border">
          {invoices.map((invoice) => {
            const total = Number(invoice.totalAmount.toString());
            const balance = computeBalance(total, invoice.amountPaid);
            return (
              <li key={invoice.id}>
                <Link
                  href={`/invoices/${invoice.id}`}
                  className="flex items-center justify-between px-4.5 py-3 text-sm hover:bg-muted/60"
                >
                  <div>
                    <div className="font-mono text-xs text-muted-foreground">{invoice.invoiceNumber}</div>
                    <div className="font-medium">
                      {currency} {invoice.totalAmount.toString()}
                      {balance > 0 && (
                        <span className="ml-2 text-xs font-normal text-[#C23B22]">
                          {currency} {balance} due
                        </span>
                      )}
                    </div>
                  </div>
                  <InvoiceStatusBadge status={invoice.status} />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
