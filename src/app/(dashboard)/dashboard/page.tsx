import Link from "next/link";
import { getTenantContext } from "@/lib/tenant";
import { rawPrisma } from "@/lib/prisma";
import { getMemberStatusCounts, listRecentMembers } from "@/features/members/queries";
import { countTodayAttendance } from "@/features/attendance/queries";
import { listOutstandingInvoices, getOutstandingBalanceTotal, getCollectedTotal } from "@/features/billing/queries";
import { getCurrentOrganization } from "@/features/organizations/queries";
import { computeBalance } from "@/features/billing/logic";
import { KpiTile } from "@/components/kpi-tile";
import { MemberStatusBadge } from "@/components/member-status-badge";
import { InvoiceStatusBadge } from "@/components/invoice-status-badge";

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default async function DashboardPage() {
  const ctx = await getTenantContext();

  const [
    branchCount,
    counts,
    recentMembers,
    todayCheckIns,
    outstandingInvoices,
    outstandingTotal,
    collectedTotal,
    organization,
  ] = await Promise.all([
    rawPrisma.branch.count({ where: { organizationId: ctx.organizationId } }),
    getMemberStatusCounts(),
    listRecentMembers(5),
    countTodayAttendance(),
    listOutstandingInvoices(),
    getOutstandingBalanceTotal(),
    getCollectedTotal(),
    getCurrentOrganization(),
  ]);
  const topOutstanding = outstandingInvoices.slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <div className="font-mono text-[11px] tracking-[0.08em] text-muted-foreground uppercase">
          {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </div>
        <h1 className="mt-1.5 text-[26px] font-bold tracking-tight">{greeting()}.</h1>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <KpiTile
          label="Collected this month"
          value={`${organization.currency} ${collectedTotal}`}
          hint="All branches"
          tone="dark"
        />
        <KpiTile
          label="Total members"
          value={String(counts.total)}
          hint={`${branchCount} ${branchCount === 1 ? "branch" : "branches"}`}
        />
        <KpiTile label="Active" value={String(counts.ACTIVE)} hint="Currently training" />
        <KpiTile label="Frozen" value={String(counts.FROZEN)} hint="Paused memberships" />
        <KpiTile label="Inactive" value={String(counts.INACTIVE)} hint="Not currently training" />
        <KpiTile label="Check-ins today" value={String(todayCheckIns)} hint="Across all branches" />
        <KpiTile
          label="Outstanding"
          value={`${organization.currency} ${outstandingTotal}`}
          hint={`${outstandingInvoices.length} unpaid ${outstandingInvoices.length === 1 ? "invoice" : "invoices"}`}
          tone="accent"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_1px_2px_rgba(20,20,26,0.03)]">
          <div className="flex items-center justify-between border-b border-border px-4.5 py-3.5">
            <div className="text-[14.5px] font-semibold">Recently added members</div>
            <Link href="/members" className="text-xs font-semibold text-primary hover:underline">
              View all
            </Link>
          </div>
          {recentMembers.length === 0 ? (
            <div className="px-4.5 py-8 text-center text-sm text-muted-foreground">
              No members yet.{" "}
              <Link href="/members/new" className="font-medium text-primary hover:underline">
                Add your first member
              </Link>
              .
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {recentMembers.map((member) => (
                <li key={member.id} className="flex items-center justify-between gap-3 px-4.5 py-3">
                  <div className="min-w-0">
                    <Link href={`/members/${member.id}`} className="truncate text-sm font-semibold hover:underline">
                      {member.firstName} {member.lastName}
                    </Link>
                    <div className="font-mono text-[11px] text-muted-foreground">
                      {member.memberCode} &middot; {member.branch.name}
                    </div>
                  </div>
                  <MemberStatusBadge status={member.status} />
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_1px_2px_rgba(20,20,26,0.03)]">
          <div className="flex items-center justify-between border-b border-border px-4.5 py-3.5">
            <div className="text-[14.5px] font-semibold">Outstanding invoices</div>
            <Link href="/billing" className="text-xs font-semibold text-primary hover:underline">
              View all
            </Link>
          </div>
          {topOutstanding.length === 0 ? (
            <div className="px-4.5 py-8 text-center text-sm text-muted-foreground">
              Nothing outstanding &mdash; all invoices are paid up.
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {topOutstanding.map((invoice) => {
                const balance = computeBalance(Number(invoice.totalAmount), Number(invoice.amountPaid));
                return (
                  <li key={invoice.id} className="flex items-center justify-between gap-3 px-4.5 py-3">
                    <div className="min-w-0">
                      <Link
                        href={`/members/${invoice.memberId}`}
                        className="truncate text-sm font-semibold hover:underline"
                      >
                        {invoice.member.firstName} {invoice.member.lastName}
                      </Link>
                      <div className="font-mono text-[11px] text-muted-foreground">
                        {invoice.invoiceNumber} &middot; {organization.currency} {balance} due
                      </div>
                    </div>
                    <InvoiceStatusBadge status={invoice.status} />
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
