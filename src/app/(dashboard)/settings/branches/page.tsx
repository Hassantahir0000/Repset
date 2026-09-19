import { listBranches } from "@/features/branches/queries";
import { NewBranchForm } from "./new-branch-form";
import { BranchRow } from "./branch-row";

export default async function BranchesSettingsPage() {
  const branches = await listBranches();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Branches</h1>
        <p className="text-sm text-gray-500">{branches.length} total</p>
      </div>

      <ul className="divide-y divide-gray-200 rounded-md border border-gray-200 bg-white">
        {branches.map((branch) => (
          <BranchRow key={branch.id} branch={branch} />
        ))}
        {branches.length === 0 && (
          <li className="px-4 py-6 text-center text-sm text-gray-500">No branches yet.</li>
        )}
      </ul>

      <div className="max-w-sm">
        <h2 className="mb-3 text-sm font-medium text-gray-900">Add a branch</h2>
        <NewBranchForm />
      </div>
    </div>
  );
}
