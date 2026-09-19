import { notFound } from "next/navigation";
import { getMember } from "@/features/members/queries";
import { listAssignableBranches } from "@/features/branches/queries";
import { MemberForm } from "../member-form";

export default async function MemberDetailPage({
  params,
}: {
  params: Promise<{ memberId: string }>;
}) {
  const { memberId } = await params;
  const member = await getMember(memberId);
  if (!member) notFound();

  const branches = await listAssignableBranches();
  // Editing an existing member should still offer their current branch even
  // if it isn't one the caller could newly assign to (e.g. an OWNER viewing
  // a member at a branch a RECEPTIONIST wouldn't see the option for).
  const branchOptions = branches.some((b) => b.id === member.branch.id)
    ? branches
    : [{ id: member.branch.id, name: member.branch.name }, ...branches];

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">
          {member.firstName} {member.lastName}
        </h1>
        <p className="text-sm text-gray-500">{member.memberCode}</p>
      </div>

      <MemberForm
        branches={branchOptions}
        memberId={member.id}
        initialValues={{
          branchId: member.branch.id,
          firstName: member.firstName,
          lastName: member.lastName,
          email: member.email ?? "",
          phone: member.phone,
          dateOfBirth: member.dateOfBirth ? member.dateOfBirth.toISOString().slice(0, 10) : "",
          gender: member.gender ?? "",
          address: member.address ?? "",
          photoUrl: member.photoUrl ?? "",
          status: member.status,
        }}
      />
    </div>
  );
}
