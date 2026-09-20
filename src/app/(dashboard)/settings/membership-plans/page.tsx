import { listPlans } from "@/features/membership-plans/queries";
import { listAssignableBranches } from "@/features/branches/queries";
import { getCurrentOrganization } from "@/features/organizations/queries";
import { getMembershipStatusCounts, getOpenMembershipCountsByPlan } from "@/features/memberships/queries";
import { PageHeader } from "@/components/page-header";
import { KpiTile } from "@/components/kpi-tile";
import { PlanRow } from "./plan-row";
import { NewPlanDialog } from "./new-plan-dialog";

export default async function MembershipPlansPage() {
  const [plans, branches, organization, statusCounts, memberCountsByPlan] = await Promise.all([
    listPlans(),
    listAssignableBranches(),
    getCurrentOrganization(),
    getMembershipStatusCounts(),
    getOpenMembershipCountsByPlan(),
  ]);

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader
        title="Membership plans"
        description={`${plans.length} plan${plans.length === 1 ? "" : "s"}`}
        actions={<NewPlanDialog branches={branches} currency={organization.currency} />}
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiTile label="Active" value={String(statusCounts.ACTIVE)} />
        <KpiTile label="Frozen" value={String(statusCounts.FROZEN)} />
        <KpiTile label="Expired" value={String(statusCounts.EXPIRED)} />
        <KpiTile label="Cancelled" value={String(statusCounts.CANCELLED)} />
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_1px_2px_rgba(20,20,26,0.03)]">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted font-mono text-[10px] tracking-[0.08em] text-muted-foreground uppercase">
              <th className="px-4.5 py-2.5 text-left font-medium">Plan</th>
              <th className="px-4.5 py-2.5 text-left font-medium">Branch</th>
              <th className="px-4.5 py-2.5 text-left font-medium">Duration</th>
              <th className="px-4.5 py-2.5 text-left font-medium">Price</th>
              <th className="px-4.5 py-2.5 text-left font-medium">Members</th>
              <th className="px-4.5 py-2.5 text-left font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {plans.map((plan) => (
              <PlanRow
                key={plan.id}
                plan={plan}
                currency={organization.currency}
                memberCount={memberCountsByPlan.get(plan.id) ?? 0}
              />
            ))}
            {plans.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4.5 py-8 text-center text-muted-foreground">
                  No plans yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
