import { listTodayAttendance } from "@/features/attendance/queries";
import { PageHeader } from "@/components/page-header";
import { CheckInDesk } from "./check-in-desk";
import { Badge } from "@/components/ui/badge";

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export default async function AttendancePage() {
  const today = await listTodayAttendance();

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader title="Check-in desk" description={`${today.length} check-ins today`} />

      <CheckInDesk />

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_1px_2px_rgba(20,20,26,0.03)]">
        <div className="border-b border-border px-4.5 py-3 text-[14.5px] font-semibold">
          Today&apos;s check-ins
        </div>
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted font-mono text-[10px] tracking-[0.08em] text-muted-foreground uppercase">
              <th className="px-4.5 py-2.5 text-left font-medium">Time</th>
              <th className="px-4.5 py-2.5 text-left font-medium">Member</th>
              <th className="px-4.5 py-2.5 text-left font-medium">Method</th>
              <th className="px-4.5 py-2.5 text-left font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {today.map((a) => (
              <tr key={a.id}>
                <td className="px-4.5 py-2.5 font-mono text-xs text-muted-foreground">
                  {formatTime(a.checkInAt.toISOString())}
                </td>
                <td className="px-4.5 py-2.5 font-medium">
                  {a.member.firstName} {a.member.lastName}{" "}
                  <span className="font-mono text-[11px] font-normal text-muted-foreground">
                    {a.member.memberCode}
                  </span>
                </td>
                <td className="px-4.5 py-2.5 text-muted-foreground">{a.method}</td>
                <td className="px-4.5 py-2.5">
                  {a.checkOutAt ? (
                    <Badge variant="secondary">Checked out</Badge>
                  ) : (
                    <Badge variant="success">In gym</Badge>
                  )}
                </td>
              </tr>
            ))}
            {today.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4.5 py-8 text-center text-muted-foreground">
                  No check-ins yet today.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
