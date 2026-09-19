import { notFound } from "next/navigation";
import { getMember } from "@/features/members/queries";
import { listAssignableBranches } from "@/features/branches/queries";
import { getCurrentMembership, listMembershipHistory } from "@/features/memberships/queries";
import { listActivePlansForAssignment } from "@/features/membership-plans/queries";
import { getCurrentOrganization } from "@/features/organizations/queries";
import { getOpenAttendance, listAttendanceForMember } from "@/features/attendance/queries";
import { MemberForm } from "../member-form";
import { PageHeader } from "@/components/page-header";
import { MembershipPanel } from "./membership-panel";
import { MembershipHistory } from "./membership-history";
import { AttendancePanel } from "./attendance-panel";

export default async function MemberDetailPage({
  params,
}: {
  params: Promise<{ memberId: string }>;
}) {
  const { memberId } = await params;
  const member = await getMember(memberId);
  if (!member) notFound();

  const [branches, currentMembership, history, plans, organization, openAttendance, recentAttendance] =
    await Promise.all([
      listAssignableBranches(),
      getCurrentMembership(memberId),
      listMembershipHistory(memberId),
      listActivePlansForAssignment(),
      getCurrentOrganization(),
      getOpenAttendance(memberId),
      listAttendanceForMember(memberId, 5),
    ]);

  // Editing an existing member should still offer their current branch even
  // if it isn't one the caller could newly assign to (e.g. an OWNER viewing
  // a member at a branch a RECEPTIONIST wouldn't see the option for).
  const branchOptions = branches.some((b) => b.id === member.branch.id)
    ? branches
    : [{ id: member.branch.id, name: member.branch.name }, ...branches];

  const isOpenMembership =
    currentMembership && ["PENDING", "ACTIVE", "FROZEN"].includes(currentMembership.status);

  return (
    <div className="max-w-4xl space-y-5">
      <PageHeader title={`${member.firstName} ${member.lastName}`} description={member.memberCode} />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
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

        <div className="space-y-5">
          <MembershipPanel
            memberId={member.id}
            currency={organization.currency}
            plans={plans.map((p) => ({ id: p.id, name: p.name, durationDays: p.durationDays }))}
            currentMembership={
              isOpenMembership && currentMembership
                ? {
                    id: currentMembership.id,
                    status: currentMembership.status,
                    startDate: currentMembership.startDate.toISOString(),
                    endDate: currentMembership.endDate.toISOString(),
                    priceAtPurchase: currentMembership.priceAtPurchase.toString(),
                    plan: { name: currentMembership.plan.name },
                  }
                : null
            }
          />
          <MembershipHistory history={history} currency={organization.currency} />
          <AttendancePanel
            memberId={member.id}
            openAttendanceId={openAttendance?.id ?? null}
            recent={recentAttendance.map((a) => ({
              id: a.id,
              checkInAt: a.checkInAt.toISOString(),
              checkOutAt: a.checkOutAt ? a.checkOutAt.toISOString() : null,
            }))}
          />
        </div>
      </div>
    </div>
  );
}
