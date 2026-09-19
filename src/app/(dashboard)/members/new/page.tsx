import { listAssignableBranches } from "@/features/branches/queries";
import { MemberForm } from "../member-form";
import { PageHeader } from "@/components/page-header";

export default async function NewMemberPage() {
  const branches = await listAssignableBranches();

  return (
    <div className="max-w-lg space-y-5">
      <PageHeader title="Add member" />
      <MemberForm branches={branches} />
    </div>
  );
}
