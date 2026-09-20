import Link from "next/link";
import { listTodayAttendance } from "@/features/attendance/queries";
import { getCurrentOrganization } from "@/features/organizations/queries";
import { PageHeader } from "@/components/page-header";
import { MemberAvatar } from "@/components/member-avatar";
import { CheckInDesk } from "./check-in-desk";
import { Badge } from "@/components/ui/badge";

function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export default async function AttendancePage() {
  const [today, organization] = await Promise.all([
    listTodayAttendance(),
    getCurrentOrganization(),
  ]);
  const inGym = today.filter((a) => a.checkOutAt === null).length;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Check-in desk"
        description={`${inGym} in the gym · ${today.length} check-in${today.length === 1 ? "" : "s"} today`}
      />

      <CheckInDesk currency={organization.currency} />

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_1px_2px_rgba(20,20,26,0.03)]">
        <div className="border-b border-border px-4.5 py-3.5 text-[14.5px] font-semibold">
          Today&apos;s check-ins
        </div>
        {today.length === 0 ? (
          <div className="px-4.5 py-10 text-center text-sm text-muted-foreground">
            No check-ins yet today.
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {today.map((a) => (
              <li key={a.id} className="flex items-center gap-3 px-4.5 py-3">
                <span className="flex-none font-mono text-xs text-muted-foreground">
                  {formatTime(a.checkInAt)}
                </span>
                <MemberAvatar
                  firstName={a.member.firstName}
                  lastName={a.member.lastName}
                  photoUrl={null}
                />
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/members/${a.memberId}`}
                    className="block truncate text-[13.5px] font-medium hover:underline"
                  >
                    {a.member.firstName} {a.member.lastName}
                  </Link>
                  <div className="font-mono text-[11px] text-muted-foreground">
                    {a.member.memberCode} · {a.method}
                  </div>
                </div>
                {a.checkOutAt ? (
                  <Badge variant="secondary">Checked out {formatTime(a.checkOutAt)}</Badge>
                ) : (
                  <Badge variant="success">In gym</Badge>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
