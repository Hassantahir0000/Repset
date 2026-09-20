import { notFound } from "next/navigation";
import Link from "next/link";
import { getInvoice } from "@/features/billing/queries";
import { getCurrentOrganization } from "@/features/organizations/queries";
import { computeBalance } from "@/features/billing/logic";
import { PageHeader } from "@/components/page-header";
import { InvoiceStatusBadge } from "@/components/invoice-status-badge";
import { PaymentPanel } from "./payment-panel";
import { PrintButton } from "./print-button";
import { formatMoney } from "@/lib/format";

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ invoiceId: string }>;
}) {
  const { invoiceId } = await params;
  const [invoice, organization] = await Promise.all([getInvoice(invoiceId), getCurrentOrganization()]);
  if (!invoice) notFound();

  const balance = computeBalance(Number(invoice.totalAmount), Number(invoice.amountPaid));

  return (
    <div className="max-w-3xl space-y-5">
      <PageHeader
        title={invoice.invoiceNumber}
        description={`${invoice.member.firstName} ${invoice.member.lastName} · ${invoice.member.memberCode}`}
        actions={<InvoiceStatusBadge status={invoice.status} />}
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="printable-receipt overflow-hidden rounded-2xl border border-border bg-card shadow-[0_1px_2px_rgba(20,20,26,0.03)]">
          <div className="flex items-center justify-between border-b border-border px-4.5 py-3">
            <div className="text-[14.5px] font-semibold">Receipt</div>
            <PrintButton />
          </div>
          <div className="space-y-3 p-4.5 font-mono text-[12.5px] leading-relaxed text-muted-foreground">
            <div className="text-foreground">{organization.name.toUpperCase()}</div>
            <div>
              {invoice.invoiceNumber} &middot; {formatDate(invoice.issueDate)}
            </div>
            <div className="border-t border-dashed border-border pt-3">
              {invoice.items.map((item) => (
                <div key={item.id} className="flex justify-between py-0.5">
                  <span>
                    {item.description}
                    {item.quantity > 1 ? ` × ${item.quantity}` : ""}
                  </span>
                  <span>{item.amount.toString()}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-dashed border-border pt-3">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{invoice.subtotal.toString()}</span>
              </div>
              {Number(invoice.taxAmount) > 0 && (
                <div className="flex justify-between">
                  <span>Tax</span>
                  <span>{invoice.taxAmount.toString()}</span>
                </div>
              )}
              {Number(invoice.discountAmount) > 0 && (
                <div className="flex justify-between">
                  <span>Discount</span>
                  <span>&minus;{invoice.discountAmount.toString()}</span>
                </div>
              )}
            </div>
            <div className="border-t border-dashed border-border pt-3 text-[13px] text-foreground">
              <div className="flex justify-between font-semibold">
                <span>TOTAL</span>
                <span>
                  {formatMoney(organization.currency, Number(invoice.totalAmount))}
                </span>
              </div>
              <div className="mt-1 flex justify-between">
                <span>Paid</span>
                <span>
                  {formatMoney(organization.currency, Number(invoice.amountPaid))}
                </span>
              </div>
              <div className="flex justify-between font-semibold">
                <span>Balance</span>
                <span className={balance > 0 ? "text-[#C23B22]" : "text-[#1F7A4D]"}>
                  {formatMoney(organization.currency, balance)}
                </span>
              </div>
            </div>
            <div className="text-[11px]">Due {formatDate(invoice.dueDate)}</div>
          </div>
        </div>

        <PaymentPanel
          invoiceId={invoice.id}
          invoiceNumber={invoice.invoiceNumber}
          status={invoice.status}
          balance={balance}
          currency={organization.currency}
          payments={invoice.payments.map((p) => ({
            id: p.id,
            amount: p.amount.toString(),
            method: p.method,
            receiptNumber: p.receiptNumber,
            paidAt: p.paidAt.toISOString(),
          }))}
        />
      </div>

      <Link href={`/members/${invoice.memberId}`} className="text-sm text-primary hover:underline">
        &larr; Back to member
      </Link>
    </div>
  );
}
