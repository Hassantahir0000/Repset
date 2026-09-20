import Link from "next/link";
import { MemberAvatar } from "@/components/member-avatar";
import { MemberStatusBadge } from "@/components/member-status-badge";
import type { MemberStatus } from "@/generated/prisma/enums";
import { cn } from "cn";

export const MEMBER_TABS = ["overview", "payments", "attendance", "edit"] as const;
export type MemberTab = (typeof MEMBER_TABS)[number];

export function isMemberTab(value: string | undefined): value is MemberTab {
  return MEMBER_TABS.includes(value as MemberTab);
}

const TAB_LABELS: Record<MemberTab, string> = {
  overview: "Overview",
  payments: "Payments",
  attendance: "Attendance",
  edit: "Edit",
};

export function ProfileHeader({
  member,
  activeTab,
}: {
  member: {
    id: string;
    firstName: string;
    lastName: string;
    memberCode: string;
    phone: string;
    photoUrl: string | null;
    status: MemberStatus;
    joinedAt: Date;
    branchName: string;
  };
  activeTab: MemberTab;
}) {
  return (
    <div>
      <Link
        href="/members"
        className="font-mono text-[11px] tracking-[0.08em] text-muted-foreground uppercase hover:text-foreground"
      >
        ← Members
      </Link>

      <div className="mt-2.5 overflow-hidden rounded-2xl border border-border bg-card shadow-[0_1px_2px_rgba(20,20,26,0.03)]">
        <div className="h-19 bg-linear-to-r from-[#16161A] to-[#2A2A31]" />

        <div className="px-5 pb-4.5">
          <div className="-mt-7.5 flex min-w-0 gap-4">
            <MemberAvatar
              firstName={member.firstName}
              lastName={member.lastName}
              photoUrl={member.photoUrl}
              size="xl"
              className="border-[3px] border-card"
            />
            <div className="min-w-0 pt-8.5">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-[23px] font-bold tracking-tight">
                  {member.firstName} {member.lastName}
                </h1>
                <MemberStatusBadge status={member.status} />
              </div>
              <div className="mt-1.5 font-mono text-xs text-muted-foreground">
                {member.memberCode} · {member.phone} · {member.branchName} · JOINED{" "}
                {member.joinedAt.toLocaleDateString("en-US", { month: "short", year: "numeric" })}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-4.5 border-t border-border px-5">
          {MEMBER_TABS.map((tab) => (
            <Link
              key={tab}
              href={tab === "overview" ? `/members/${member.id}` : `/members/${member.id}?tab=${tab}`}
              aria-current={tab === activeTab ? "page" : undefined}
              className={cn(
                "-mb-px border-b-2 py-3.5 text-[13.5px] font-semibold transition-colors",
                tab === activeTab
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {TAB_LABELS[tab]}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
