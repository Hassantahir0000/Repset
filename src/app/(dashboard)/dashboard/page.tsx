import Link from "next/link";
import { auth } from "@/lib/auth";
import {
  getCheckInSummary,
  getMemberGrowth,
  getNeedsAction,
  getRevenueSummary,
  listRecentCheckIns,
} from "@/features/dashboard/queries";
import {
  DASHBOARD_PERIODS,
  isDashboardPeriod,
  periodLabel,
  trailingDayBuckets,
  type DashboardPeriod,
} from "@/features/dashboard/logic";
import { listExpiringMemberships } from "@/features/memberships/queries";
import { getCurrentOrganization } from "@/features/organizations/queries";
import { KpiTile } from "@/components/kpi-tile";
import { BarSeries } from "@/components/bar-series";
import { SegmentedLinks } from "@/components/segmented-links";
import { MemberAvatar } from "@/components/member-avatar";
import { formatMoney } from "@/lib/format";

const EXPIRY_HORIZON_DAYS = 14;

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function firstName(name: string | null | undefined): string {
  return name?.trim().split(/\s+/)[0] ?? "";
}

function dayLabels(count: number): string[] {
  return trailingDayBuckets(count).map((d) =>
    d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
  );
}

function daysUntil(date: Date): string {
  const days = Math.ceil((date.getTime() - Date.now()) / 86_400_000);
  if (days <= 0) return "Today";
  if (days === 1) return "1 day";
  return `${days} days`;
}

function timeOfDay(date: Date): string {
  return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const { period: periodParam } = await searchParams;
  const period: DashboardPeriod = isDashboardPeriod(periodParam) ? periodParam : "today";

  const [session, revenue, checkIns, growth, needsAction, expiring, recentCheckIns, organization] =
    await Promise.all([
      auth(),
      getRevenueSummary(period),
      getCheckInSummary(period),
      getMemberGrowth(),
      getNeedsAction(),
      listExpiringMemberships(EXPIRY_HORIZON_DAYS, 5),
      listRecentCheckIns(5),
      getCurrentOrganization(),
    ]);

  const name = firstName(session?.user?.name);
  const activeShare = growth.total === 0 ? 0 : Math.round((growth.active / growth.total) * 100);
  const periodWord = period === "today" ? "today" : period === "week" ? "this week" : "this month";

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3.5">
        <div>
          <div className="font-mono text-[11px] tracking-[0.08em] text-muted-foreground uppercase">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </div>
          <h1 className="mt-1.5 text-[28px] font-bold tracking-tight">
            {greeting()}
            {name ? `, ${name}` : ""}.
          </h1>
          <div className="mt-1.5 text-sm text-muted-foreground">
            {checkIns.total} check-in{checkIns.total === 1 ? "" : "s"} and{" "}
            {formatMoney(organization.currency, revenue.total)} collected {periodWord}.
          </div>
        </div>
        <SegmentedLinks
          items={DASHBOARD_PERIODS.map((p) => ({
            label: periodLabel(p),
            href: p === "today" ? "/dashboard" : `/dashboard?period=${p}`,
            active: p === period,
          }))}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiTile
          label={`Revenue · ${periodLabel(period)}`}
          value={formatMoney(organization.currency, revenue.total)}
          tone="dark"
        >
          {revenue.deltaPercent !== null && (
            <div className="mt-2.5 flex items-center gap-2">
              <span
                className={
                  revenue.deltaPercent >= 0
                    ? "rounded-full bg-[#6FBF8F]/16 px-2 py-0.5 text-xs font-semibold text-[#7FD2A3]"
                    : "rounded-full bg-primary/20 px-2 py-0.5 text-xs font-semibold text-[#F2A08D]"
                }
              >
                {revenue.deltaPercent >= 0 ? "+" : ""}
                {revenue.deltaPercent}%
              </span>
              <span className="text-xs text-[#8E8E97]">vs previous</span>
            </div>
          )}
          <BarSeries
            values={revenue.trend}
            labels={dayLabels(revenue.trend.length)}
            formatValue={(v) => formatMoney(organization.currency, v)}
            tone="dark"
            className="mt-4 h-11"
          />
          <div className="mt-2 text-[11px] text-[#8E8E97]">Last {revenue.trend.length} days</div>
        </KpiTile>

        <KpiTile
          label="Active members"
          value={String(growth.active)}
          hint={
            growth.joinedThisMonth > 0
              ? `+${growth.joinedThisMonth} joined this month`
              : "No new members this month"
          }
        >
          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-secondary">
            <div className="h-full rounded-full bg-[#1F7A4D]" style={{ width: `${activeShare}%` }} />
          </div>
          <div className="mt-1.5 text-[11.5px] text-muted-foreground">
            {activeShare}% of {growth.total} member{growth.total === 1 ? "" : "s"} active
          </div>
        </KpiTile>

        <KpiTile
          label={`Check-ins · ${periodLabel(period)}`}
          value={String(checkIns.total)}
          hint={
            checkIns.peakLabel
              ? `Peak ${checkIns.peakLabel} · ${checkIns.currentlyIn} in now`
              : `${checkIns.currentlyIn} in the gym now`
          }
        >
          <BarSeries
            values={checkIns.trend}
            labels={dayLabels(checkIns.trend.length)}
            formatValue={(v) => `${v} check-in${v === 1 ? "" : "s"}`}
            className="mt-4 h-7.5"
          />
        </KpiTile>

        <KpiTile
          label="Needs action"
          value={String(needsAction.total)}
          hint={
            needsAction.total === 0
              ? "Nothing expiring, nothing unpaid"
              : `${needsAction.expiringCount} expiring · ${needsAction.unpaidCount} unpaid (${formatMoney(
                  organization.currency,
                  needsAction.unpaidTotal,
                )})`
          }
          tone={needsAction.total === 0 ? "default" : "accent"}
        >
          {needsAction.total > 0 && (
            <Link
              href={needsAction.unpaidCount > 0 ? "/billing" : "/members"}
              className="mt-3.5 inline-block rounded-[9px] bg-primary px-3.5 py-2 text-[12.5px] font-semibold text-primary-foreground hover:opacity-90"
            >
              Work the list
            </Link>
          )}
        </KpiTile>
      </div>

      <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-2">
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_1px_2px_rgba(20,20,26,0.03)]">
          <div className="flex items-center justify-between border-b border-border px-4.5 py-3.5">
            <div className="text-[14.5px] font-semibold">Expiring soon</div>
            <Link
              href="/members"
              className="rounded-lg border border-border px-2.5 py-1 text-xs font-semibold hover:border-foreground"
            >
              View all
            </Link>
          </div>
          {expiring.length === 0 ? (
            <div className="px-4.5 py-10 text-center text-sm text-muted-foreground">
              Nothing expiring in the next {EXPIRY_HORIZON_DAYS} days.
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {expiring.map((m) => (
                <li key={m.id} className="flex items-center gap-3 px-4.5 py-3">
                  <MemberAvatar
                    firstName={m.memberName.split(" ")[0] ?? ""}
                    lastName={m.memberName.split(" ")[1] ?? ""}
                    photoUrl={m.photoUrl}
                  />
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/members/${m.memberId}`}
                      className="block truncate text-[13.5px] font-semibold hover:underline"
                    >
                      {m.memberName}
                    </Link>
                    <div className="truncate text-xs text-muted-foreground">{m.planName}</div>
                  </div>
                  <span className="flex-none rounded-full bg-[#FDF1EE] px-2.5 py-1 text-[11.5px] font-semibold text-[#C23B22]">
                    {daysUntil(m.endDate)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_1px_2px_rgba(20,20,26,0.03)]">
          <div className="flex items-center justify-between border-b border-border px-4.5 py-3.5">
            <div className="text-[14.5px] font-semibold">Recent check-ins</div>
            <Link
              href="/attendance"
              className="text-xs font-semibold text-primary hover:underline"
            >
              Check-in desk
            </Link>
          </div>
          {recentCheckIns.length === 0 ? (
            <div className="px-4.5 py-10 text-center text-sm text-muted-foreground">
              No check-ins recorded yet.
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {recentCheckIns.map((c) => (
                <li key={c.id} className="flex items-center gap-3 px-4.5 py-3">
                  <span className="flex-none font-mono text-xs text-muted-foreground">
                    {timeOfDay(c.checkInAt)}
                  </span>
                  <Link
                    href={`/members/${c.memberId}`}
                    className="min-w-0 flex-1 truncate text-[13.5px] font-medium hover:underline"
                  >
                    {c.memberName}
                  </Link>
                  <span
                    className={
                      c.checkOutAt
                        ? "flex-none rounded-full bg-secondary px-2.5 py-1 text-[11px] font-semibold text-muted-foreground"
                        : "flex-none rounded-full bg-[#EAF5EE] px-2.5 py-1 text-[11px] font-semibold text-[#1F7A4D]"
                    }
                  >
                    {c.checkOutAt ? "CHECKED OUT" : "IN GYM"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
