import { listBranches } from "@/features/branches/queries";
import { NewBranchForm } from "./new-branch-form";
import { BranchRow } from "./branch-row";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";

export default async function BranchesSettingsPage() {
  const branches = await listBranches();

  return (
    <div className="max-w-lg space-y-6">
      <PageHeader title="Branches" description={`${branches.length} total`} />

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_1px_2px_rgba(20,20,26,0.03)]">
        <ul className="divide-y divide-border">
          {branches.map((branch) => (
            <BranchRow key={branch.id} branch={branch} />
          ))}
          {branches.length === 0 && (
            <li className="px-4.5 py-8 text-center text-sm text-muted-foreground">No branches yet.</li>
          )}
        </ul>
      </div>

      <div>
        <h2 className="mb-3 text-[14.5px] font-semibold">Add a branch</h2>
        <Card>
          <CardContent>
            <NewBranchForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
