import Link from "next/link";
import { listMembersWithSummary } from "@/features/members/queries";
import { getCurrentOrganization } from "@/features/organizations/queries";
import { listAssignableBranches } from "@/features/branches/queries";
import { listActivePlansForAssignment } from "@/features/membership-plans/queries";
import { MemberSearch } from "./member-search";
import { AddMemberSheet } from "./add-member-sheet";
import { MemberStatusBadge } from "@/components/member-status-badge";
import { PageHeader } from "@/components/page-header";
import type { MemberStatus } from "@/generated/prisma/enums";
import { cn } from "cn";

const STATUS_FILTERS: { label: string; value?: MemberStatus }[] = [
  { label: "All" },
  { label: "Active", value: "ACTIVE" },
  { label: "Frozen", value: "FROZEN" },
  { label: "Inactive", value: "INACTIVE" },
];

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatRelative(date: Date | null): string {
  if (!date) return "Never";
  const days = Math.floor((Date.now() - date.getTime()) / 86_400_000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
}

export default async function MembersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const { q, status } = await searchParams;
  const activeStatus = STATUS_FILTERS.find((f) => f.value === status)?.value;
  const [members, organization, branches, plans] = await Promise.all([
    listMembersWithSummary(q, activeStatus),
    getCurrentOrganization(),
    listAssignableBranches(),
    listActivePlansForAssignment(),
  ]);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Members"
        description={`${members.length} shown`}
        actions={
          <AddMemberSheet
            branches={branches}
            plans={plans.map((p) => ({
              id: p.id,
              name: p.name,
              durationDays: p.durationDays,
              price: p.price.toString(),
              registrationFee: p.registrationFee.toString(),
            }))}
            currency={organization.currency}
          />
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <MemberSearch defaultValue={q ?? ""} status={status ?? ""} />
        <div className="flex gap-1 rounded-full bg-secondary p-[3px]">
          {STATUS_FILTERS.map((f) => {
            const isActive = (f.value ?? "") === (status ?? "");
            const params = new URLSearchParams();
            if (q) params.set("q", q);
            if (f.value) params.set("status", f.value);
            const href = params.toString() ? `/members?${params}` : "/members";
            return (
              <Link
                key={f.label}
                href={href}
                className={cn(
                  "rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors",
                  isActive ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {f.label}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_1px_2px_rgba(20,20,26,0.03)]">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted font-mono text-[10px] tracking-[0.08em] text-muted-foreground uppercase">
              <th className="px-4.5 py-2.5 text-left font-medium">Member</th>
              <th className="px-4.5 py-2.5 text-left font-medium">Plan</th>
              <th className="px-4.5 py-2.5 text-left font-medium">Status</th>
              <th className="px-4.5 py-2.5 text-left font-medium">Expiry</th>
              <th className="px-4.5 py-2.5 text-left font-medium">Balance</th>
              <th className="px-4.5 py-2.5 text-left font-medium">Last visit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {members.map((member) => (
              <tr key={member.id} className="hover:bg-muted/60">
                <td className="px-4.5 py-2.5">
                  <Link href={`/members/${member.id}`} className="flex items-center gap-2.5">
                    {member.photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={member.photoUrl} alt="" className="h-8 w-8 rounded-[10px] object-cover" />
                    ) : (
                      <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-secondary text-xs font-medium text-muted-foreground">
                        {member.firstName[0]}
                        {member.lastName[0]}
                      </span>
                    )}
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-foreground">
                        {member.firstName} {member.lastName}
                      </span>
                      <span className="block font-mono text-[11px] text-muted-foreground">{member.memberCode}</span>
                    </span>
                  </Link>
                </td>
                <td className="px-4.5 py-2.5 text-muted-foreground">
                  {member.currentMembership?.planName ?? "—"}
                </td>
                <td className="px-4.5 py-2.5">
                  <MemberStatusBadge status={member.status} />
                </td>
                <td className="px-4.5 py-2.5 font-mono text-xs text-muted-foreground">
                  {member.currentMembership ? formatDate(member.currentMembership.endDate) : "—"}
                </td>
                <td
                  className={cn(
                    "px-4.5 py-2.5 font-mono text-xs",
                    member.outstandingBalance > 0 ? "font-medium text-[#C23B22]" : "text-muted-foreground",
                  )}
                >
                  {member.outstandingBalance > 0 ? `${organization.currency} ${member.outstandingBalance}` : "—"}
                </td>
                <td className="px-4.5 py-2.5 text-muted-foreground">{formatRelative(member.lastVisit)}</td>
              </tr>
            ))}
            {members.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4.5 py-10 text-center text-muted-foreground">
                  No members match that.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
