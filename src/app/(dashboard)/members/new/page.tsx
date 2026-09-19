import { listAssignableBranches } from "@/features/branches/queries";
import { MemberForm } from "../member-form";

export default async function NewMemberPage() {
  const branches = await listAssignableBranches();

  return (
    <div className="max-w-lg space-y-6">
      <h1 className="text-xl font-semibold text-gray-900">Add member</h1>
      <MemberForm branches={branches} />
    </div>
  );
}
