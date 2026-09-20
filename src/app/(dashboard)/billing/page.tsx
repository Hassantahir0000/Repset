import Link from "next/link";
import { listOutstandingInvoices, getOutstandingBalanceTotal, getCollectedTotal } from "@/features/billing/queries";
import { getCurrentOrganization } from "@/features/organizations/queries";
import { computeBalance } from "@/features/billing/logic";
import { PageHeader } from "@/components/page-header";
import { KpiTile } from "@/components/kpi-tile";
import { InvoiceStatusBadge } from "@/components/invoice-status-badge";
import { formatMoney } from "@/lib/format";

export default async function BillingOverviewPage() {
  const [invoices, totalOutstanding, collectedTotal, organization] = await Promise.all([
    listOutstandingInvoices(),
    getOutstandingBalanceTotal(),
    getCollectedTotal(),
    getCurrentOrganization(),
  ]);

  return (
    <div className="space-y-5">
      <PageHeader title="Billing" description={`${invoices.length} outstanding invoice${invoices.length === 1 ? "" : "s"}`} />

      <div className="grid grid-cols-2 gap-3 lg:max-w-2xl">
        <KpiTile
          label="Collected this month"
          value={formatMoney(organization.currency, collectedTotal)}
          tone="dark"
        />
        <KpiTile
          label="Outstanding"
          value={formatMoney(organization.currency, totalOutstanding)}
          hint={`${invoices.length} unpaid`}
          tone={totalOutstanding > 0 ? "accent" : "default"}
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_1px_2px_rgba(20,20,26,0.03)]">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted font-mono text-[10px] tracking-[0.08em] text-muted-foreground uppercase">
              <th className="px-4.5 py-2.5 text-left font-medium">Invoice</th>
              <th className="px-4.5 py-2.5 text-left font-medium">Member</th>
              <th className="px-4.5 py-2.5 text-left font-medium">Total</th>
              <th className="px-4.5 py-2.5 text-left font-medium">Balance</th>
              <th className="px-4.5 py-2.5 text-left font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {invoices.map((invoice) => {
              const balance = computeBalance(Number(invoice.totalAmount), Number(invoice.amountPaid));
              return (
                <tr key={invoice.id} className="hover:bg-muted/60">
                  <td className="px-4.5 py-2.5">
                    <Link href={`/invoices/${invoice.id}`} className="font-mono text-xs hover:underline">
                      {invoice.invoiceNumber}
                    </Link>
                  </td>
                  <td className="px-4.5 py-2.5">
                    <Link href={`/members/${invoice.memberId}`} className="hover:underline">
                      {invoice.member.firstName} {invoice.member.lastName}
                    </Link>
                  </td>
                  <td className="px-4.5 py-2.5 font-mono text-xs text-muted-foreground">
                    {formatMoney(organization.currency, Number(invoice.totalAmount))}
                  </td>
                  <td className="px-4.5 py-2.5 font-mono text-xs font-medium text-[#C23B22]">
                    {formatMoney(organization.currency, balance)}
                  </td>
                  <td className="px-4.5 py-2.5">
                    <InvoiceStatusBadge status={invoice.status} />
                  </td>
                </tr>
              );
            })}
            {invoices.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4.5 py-10 text-center text-muted-foreground">
                  Nothing outstanding &mdash; all invoices are paid up.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
