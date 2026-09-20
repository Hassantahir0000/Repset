import Link from "next/link";
import { InvoiceStatusBadge } from "@/components/invoice-status-badge";
import { computeBalance } from "@/features/billing/logic";
import type { InvoiceStatus, PaymentMethod } from "@/generated/prisma/enums";
import { formatMoney } from "@/lib/format";

type InvoiceItem = {
  id: string;
  invoiceNumber: string;
  status: InvoiceStatus;
  totalAmount: { toString(): string };
  amountPaid: number;
  description: string | null;
  method: PaymentMethod | null;
};

function methodLabel(method: PaymentMethod | null): string {
  if (!method) return "—";
  return method.charAt(0) + method.slice(1).replace("_", " ").toLowerCase();
}

export function BillingPanel({ invoices, currency }: { invoices: InvoiceItem[]; currency: string }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_1px_2px_rgba(20,20,26,0.03)]">
      <div className="border-b border-border px-4.5 py-3.5 text-[14.5px] font-semibold">Invoices</div>
      {invoices.length === 0 ? (
        <p className="px-4.5 py-10 text-center text-sm text-muted-foreground">No invoices yet.</p>
      ) : (
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted font-mono text-[10px] tracking-[0.08em] text-muted-foreground uppercase">
              <th className="px-4.5 py-2.5 text-left font-medium">Invoice</th>
              <th className="px-4.5 py-2.5 text-left font-medium">Item</th>
              <th className="px-4.5 py-2.5 text-left font-medium">Amount</th>
              <th className="px-4.5 py-2.5 text-left font-medium">Method</th>
              <th className="px-4.5 py-2.5 text-left font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {invoices.map((invoice) => {
              const total = Number(invoice.totalAmount.toString());
              const balance = computeBalance(total, invoice.amountPaid);
              return (
                <tr key={invoice.id} className="hover:bg-muted/60">
                  <td className="px-4.5 py-2.5">
                    <Link
                      href={`/invoices/${invoice.id}`}
                      className="font-mono text-xs hover:underline"
                    >
                      {invoice.invoiceNumber}
                    </Link>
                  </td>
                  <td className="max-w-55 truncate px-4.5 py-2.5 text-muted-foreground">
                    {invoice.description ?? "—"}
                  </td>
                  <td className="px-4.5 py-2.5">
                    {formatMoney(currency, total)}
                    {balance > 0 && (
                      <span className="ml-2 text-xs text-[#C23B22]">
                        {formatMoney(currency, balance)} due
                      </span>
                    )}
                  </td>
                  <td className="px-4.5 py-2.5 text-muted-foreground">
                    {methodLabel(invoice.method)}
                  </td>
                  <td className="px-4.5 py-2.5">
                    <InvoiceStatusBadge status={invoice.status} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
