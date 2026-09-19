import { listPlans } from "@/features/membership-plans/queries";
import { listAssignableBranches } from "@/features/branches/queries";
import { getCurrentOrganization } from "@/features/organizations/queries";
import { PageHeader } from "@/components/page-header";
import { PlanRow } from "./plan-row";
import { NewPlanForm } from "./new-plan-form";

export default async function MembershipPlansPage() {
  const [plans, branches, organization] = await Promise.all([
    listPlans(),
    listAssignableBranches(),
    getCurrentOrganization(),
  ]);

  return (
    <div className="max-w-2xl space-y-6">
      <PageHeader title="Membership plans" description={`${plans.length} total`} />

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_1px_2px_rgba(20,20,26,0.03)]">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted font-mono text-[10px] tracking-[0.08em] text-muted-foreground uppercase">
              <th className="px-4.5 py-2.5 text-left font-medium">Plan</th>
              <th className="px-4.5 py-2.5 text-left font-medium">Branch</th>
              <th className="px-4.5 py-2.5 text-left font-medium">Duration</th>
              <th className="px-4.5 py-2.5 text-left font-medium">Price</th>
              <th className="px-4.5 py-2.5 text-left font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {plans.map((plan) => (
              <PlanRow key={plan.id} plan={plan} currency={organization.currency} />
            ))}
            {plans.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4.5 py-8 text-center text-muted-foreground">
                  No plans yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div>
        <h2 className="mb-3 text-[14.5px] font-semibold">Add a plan</h2>
        <NewPlanForm branches={branches} currency={organization.currency} />
      </div>
    </div>
  );
}
