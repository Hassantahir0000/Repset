import { notFound } from "next/navigation";
import { getMember } from "@/features/members/queries";
import { listAssignableBranches } from "@/features/branches/queries";
import { getCurrentMembership, listMembershipHistory } from "@/features/memberships/queries";
import { listActivePlansForAssignment } from "@/features/membership-plans/queries";
import { getCurrentOrganization } from "@/features/organizations/queries";
import {
  getOpenAttendance,
  listAttendanceForMember,
  listAttendanceSince,
} from "@/features/attendance/queries";
import {
  getMemberLifetimeValue,
  listInvoicesForMember,
  listOpenInvoicesForMember,
} from "@/features/billing/queries";
import { listMemberActivity } from "@/features/members/queries";
import { peakHour, formatHourRange } from "@/features/dashboard/logic";
import { TakePaymentSheet } from "@/components/take-payment-sheet";
import { RenewMembershipSheet } from "./renew-membership-sheet";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/format";
import { MemberForm } from "../member-form";
import { MembershipPanel } from "./membership-panel";
import { MembershipHistory } from "./membership-history";
import { AttendancePanel } from "./attendance-panel";
import { BillingPanel } from "./billing-panel";
import { ProfileHeader, isMemberTab, type MemberTab } from "./profile-header";
import { AttendanceHeatmap } from "@/components/attendance-heatmap";

const HEATMAP_DAYS = 30;

function formatDateTime(date: Date): string {
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function duration(checkIn: Date, checkOut: Date | null): string {
  if (!checkOut) return "—";
  const minutes = Math.round((checkOut.getTime() - checkIn.getTime()) / 60_000);
  const hours = Math.floor(minutes / 60);
  return hours > 0 ? `${hours}h ${minutes % 60}m` : `${minutes}m`;
}

export default async function MemberDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ memberId: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { memberId } = await params;
  const { tab: tabParam } = await searchParams;
  const tab: MemberTab = isMemberTab(tabParam) ? tabParam : "overview";

  const member = await getMember(memberId);
  if (!member) notFound();

  const heatmapSince = new Date();
  heatmapSince.setDate(heatmapSince.getDate() - HEATMAP_DAYS);

  const [
    branches,
    currentMembership,
    history,
    plans,
    organization,
    openAttendance,
    recentAttendance,
    heatmapAttendance,
    invoices,
    lifetimeValue,
    openInvoices,
    activity,
  ] = await Promise.all([
    listAssignableBranches(),
    getCurrentMembership(memberId),
    listMembershipHistory(memberId),
    listActivePlansForAssignment(),
    getCurrentOrganization(),
    getOpenAttendance(memberId),
    listAttendanceForMember(memberId, 20),
    listAttendanceSince(memberId, heatmapSince),
    listInvoicesForMember(memberId),
    getMemberLifetimeValue(memberId),
    listOpenInvoicesForMember(memberId),
    listMemberActivity(memberId, 6),
  ]);

  const outstandingBalance = openInvoices.reduce((sum, inv) => sum + inv.balance, 0);
  const planOptions = plans.map((p) => ({
    id: p.id,
    name: p.name,
    durationDays: p.durationDays,
    price: p.price.toString(),
    registrationFee: p.registrationFee.toString(),
  }));

  const usualHour = peakHour(heatmapAttendance.map((a) => a.checkInAt));
  const visitsPerWeek = (heatmapAttendance.length / (HEATMAP_DAYS / 7)).toFixed(1);

  // Editing an existing member should still offer their current branch even
  // if it isn't one the caller could newly assign to (e.g. an OWNER viewing
  // a member at a branch a RECEPTIONIST wouldn't see the option for).
  const branchOptions = branches.some((b) => b.id === member.branch.id)
    ? branches
    : [{ id: member.branch.id, name: member.branch.name }, ...branches];

  const isOpenMembership =
    currentMembership && ["PENDING", "ACTIVE", "FROZEN"].includes(currentMembership.status);
  const openMembership = isOpenMembership && currentMembership ? currentMembership : null;

  return (
    <div className="max-w-5xl space-y-4">
      <ProfileHeader
        member={{
          id: member.id,
          firstName: member.firstName,
          lastName: member.lastName,
          memberCode: member.memberCode,
          phone: member.phone,
          photoUrl: member.photoUrl,
          status: member.status,
          joinedAt: member.joinedAt,
          branchName: member.branch.name,
        }}
        activeTab={tab}
        actions={
          <>
            <RenewMembershipSheet
              memberId={member.id}
              currentMembership={
                openMembership
                  ? {
                      id: openMembership.id,
                      planId: openMembership.planId,
                      planName: openMembership.plan.name,
                    }
                  : null
              }
              plans={planOptions}
              currency={organization.currency}
              trigger={
                <Button>{openMembership ? "Renew membership" : "Sell membership"}</Button>
              }
            />
            {openInvoices.length > 0 && (
              <TakePaymentSheet
                invoices={openInvoices}
                currency={organization.currency}
                trigger={<Button variant="outline">Take payment</Button>}
              />
            )}
          </>
        }
      />

      {tab === "overview" && (
        <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-2">
          <div className="space-y-3.5">
            <MembershipPanel
              memberId={member.id}
              currency={organization.currency}
              plans={plans.map((p) => ({ id: p.id, name: p.name, durationDays: p.durationDays }))}
              currentMembership={
                openMembership
                  ? {
                      id: openMembership.id,
                      status: openMembership.status,
                      startDate: openMembership.startDate.toISOString(),
                      endDate: openMembership.endDate.toISOString(),
                      priceAtPurchase: openMembership.priceAtPurchase.toString(),
                      plan: { name: openMembership.plan.name },
                    }
                  : null
              }
              outstandingBalance={outstandingBalance}
            />
            <MembershipHistory history={history} currency={organization.currency} />
          </div>

          <div className="space-y-3.5">
            <div className="rounded-2xl border border-border bg-card p-4.5 shadow-[0_1px_2px_rgba(20,20,26,0.03)]">
              <div className="flex items-baseline justify-between">
                <div className="text-[14.5px] font-semibold">Attendance</div>
                <div className="text-xs text-muted-foreground">
                  {heatmapAttendance.length} visit{heatmapAttendance.length === 1 ? "" : "s"} ·{" "}
                  {HEATMAP_DAYS} days
                </div>
              </div>
              <AttendanceHeatmap
                checkIns={heatmapAttendance.map((a) => a.checkInAt)}
                days={HEATMAP_DAYS}
                className="mt-4"
              />
              <div className="mt-3.5 text-[12.5px] text-muted-foreground">
                {heatmapAttendance.length === 0
                  ? "No visits in the last 30 days."
                  : `${usualHour === null ? "" : `Usually trains ${formatHourRange(usualHour)} · `}${visitsPerWeek} visits per week`}
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_1px_2px_rgba(20,20,26,0.03)]">
              <div className="border-b border-border px-4.5 py-3.5 text-[14.5px] font-semibold">
                Recent activity
              </div>
              {activity.length === 0 ? (
                <div className="px-4.5 py-8 text-center text-sm text-muted-foreground">
                  Nothing recorded yet.
                </div>
              ) : (
                <ul className="divide-y divide-border">
                  {activity.map((event) => (
                    <li key={event.id} className="flex gap-3 px-4.5 py-3 text-[13.5px]">
                      <span className="flex-none font-mono text-[11px] text-muted-foreground uppercase">
                        {event.at.toLocaleDateString("en-US", { day: "2-digit", month: "short" })}
                      </span>
                      <span className="min-w-0">{event.summary}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {tab === "payments" && (
        <div className="space-y-3.5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-border bg-card p-4 shadow-[0_1px_2px_rgba(20,20,26,0.03)]">
              <div className="font-mono text-[10px] tracking-[0.08em] text-muted-foreground uppercase">
                Lifetime value
              </div>
              <div className="mt-2.5 text-[28px] font-bold tracking-tight">
                {formatMoney(organization.currency, lifetimeValue)}
              </div>
            </div>
            <div className="rounded-2xl border border-border bg-card p-4 shadow-[0_1px_2px_rgba(20,20,26,0.03)]">
              <div className="font-mono text-[10px] tracking-[0.08em] text-muted-foreground uppercase">
                Invoices
              </div>
              <div className="mt-2.5 text-[28px] font-bold tracking-tight">{invoices.length}</div>
            </div>
          </div>
          <BillingPanel
            invoices={invoices.map((inv) => ({
              id: inv.id,
              invoiceNumber: inv.invoiceNumber,
              status: inv.status,
              totalAmount: inv.totalAmount,
              amountPaid: Number(inv.amountPaid),
              description: inv.items[0]?.description ?? null,
              method: inv.payments[0]?.method ?? null,
            }))}
            currency={organization.currency}
          />
        </div>
      )}

      {tab === "attendance" && (
        <div className="space-y-3.5">
          <AttendancePanel
            memberId={member.id}
            openAttendanceId={openAttendance?.id ?? null}
            recent={recentAttendance.slice(0, 5).map((a) => ({
              id: a.id,
              checkInAt: a.checkInAt.toISOString(),
              checkOutAt: a.checkOutAt ? a.checkOutAt.toISOString() : null,
            }))}
          />

          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_1px_2px_rgba(20,20,26,0.03)]">
            <div className="border-b border-border px-4.5 py-3.5 text-[14.5px] font-semibold">
              Visit history
            </div>
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted font-mono text-[10px] tracking-[0.08em] text-muted-foreground uppercase">
                  <th className="px-4.5 py-2.5 text-left font-medium">Check-in</th>
                  <th className="px-4.5 py-2.5 text-left font-medium">Check-out</th>
                  <th className="px-4.5 py-2.5 text-left font-medium">Duration</th>
                  <th className="px-4.5 py-2.5 text-left font-medium">Method</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {recentAttendance.map((a) => (
                  <tr key={a.id}>
                    <td className="px-4.5 py-2.5">{formatDateTime(a.checkInAt)}</td>
                    <td className="px-4.5 py-2.5 text-muted-foreground">
                      {a.checkOutAt ? formatDateTime(a.checkOutAt) : "Still in"}
                    </td>
                    <td className="px-4.5 py-2.5 font-mono text-xs">
                      {duration(a.checkInAt, a.checkOutAt)}
                    </td>
                    <td className="px-4.5 py-2.5 text-muted-foreground">{a.method}</td>
                  </tr>
                ))}
                {recentAttendance.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4.5 py-10 text-center text-muted-foreground">
                      No visits recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "edit" && (
        <div className="max-w-xl">
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
      )}
    </div>
  );
}
