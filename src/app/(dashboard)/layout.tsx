import { redirect } from "next/navigation";
import Link from "next/link";
import { auth, signOut } from "@/lib/auth";
import { getCurrentOrganization } from "@/features/organizations/queries";
import { listBranches } from "@/features/branches/queries";
import { getBranchFilterValue } from "@/lib/branch-filter";
import { SidebarNav, type NavGroup } from "@/components/sidebar-nav";
import { BranchSwitcher } from "@/components/branch-switcher";
import { CommandPalette } from "@/components/command-palette";
import { QuickActionMenu } from "@/components/quick-action-menu";
import { getRenewalRiskSummary } from "@/features/memberships/queries";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/format";

const NAV_GROUPS: NavGroup[] = [
  {
    label: "WORKSPACE",
    items: [
      { href: "/dashboard", label: "Dashboard" },
      { href: "/attendance", label: "Check-in Desk" },
    ],
  },
  {
    label: "PEOPLE",
    items: [
      { href: "/members", label: "Members" },
      { href: "/settings/membership-plans", label: "Memberships" },
    ],
  },
  {
    label: "MONEY",
    items: [{ href: "/billing", label: "Billing" }],
  },
  {
    label: "ADMIN",
    items: [
      { href: "/settings/organization", label: "Organization" },
      { href: "/settings/branches", label: "Branches" },
    ],
  },
];

const NAV_TARGETS = NAV_GROUPS.flatMap((group) =>
  group.items.map((item) => ({ href: item.href, label: item.label, group: group.label })),
);

const RENEWAL_RISK_WINDOW_DAYS = 7;

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

function roleLabel(role: string, branchName: string | null): string {
  const pretty = role.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
  return branchName ? `${pretty} · ${branchName}` : `${pretty} · all branches`;
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const [organization, renewalRisk] = await Promise.all([
    getCurrentOrganization(),
    getRenewalRiskSummary(RENEWAL_RISK_WINDOW_DAYS),
  ]);

  const isOrgWideRole = session.user.activeBranchId === null;
  const branches = await listBranches();
  const branchFilter = isOrgWideRole ? await getBranchFilterValue() : null;
  const currentBranchId = branchFilter && branches.some((b) => b.id === branchFilter) ? branchFilter : null;
  const displayBranchId = isOrgWideRole ? currentBranchId : session.user.activeBranchId;
  const displayBranchName = branches.find((b) => b.id === displayBranchId)?.name ?? null;

  return (
    <div className="grid h-screen grid-cols-[232px_minmax(0,1fr)] bg-background">
      <aside className="flex flex-col gap-1 overflow-y-auto bg-sidebar p-3.5 text-sidebar-foreground">
        <div className="flex items-center gap-2.5 px-1.5 pt-1 pb-4">
          <div className="h-6.5 w-6.5 flex-none rounded-[8px] bg-primary shadow-[0_6px_18px_-6px_rgba(232,70,42,0.8)]" />
          <div className="min-w-0">
            <div className="text-[15px] font-bold tracking-tight text-white">Repset</div>
            <div className="truncate text-[11px] text-[#74747C]">{organization.name}</div>
          </div>
        </div>

        <CommandPalette targets={NAV_TARGETS} />

        <SidebarNav groups={NAV_GROUPS} />

        <div className="mt-auto pt-4">
          {renewalRisk.count > 0 && (
            <div className="rounded-xl border border-sidebar-border bg-gradient-to-b from-[#1E1E23] to-[#17171B] p-3.5">
              <div className="text-[12.5px] font-semibold text-[#F2F1EF]">
                {renewalRisk.count} renewal{renewalRisk.count === 1 ? "" : "s"} due in {RENEWAL_RISK_WINDOW_DAYS} days
              </div>
              <div className="mt-1 text-[12px] leading-snug text-[#85858D]">
                {formatMoney(organization.currency, renewalRisk.totalValue)} at risk if nobody
                follows up.
              </div>
              <Link
                href="/members"
                className="mt-2.5 block w-full rounded-lg bg-primary px-2 py-2 text-center text-[12.5px] font-semibold text-primary-foreground hover:opacity-90"
              >
                Review members
              </Link>
            </div>
          )}
          <div className="mt-3.5 flex items-center gap-2.5 border-t border-sidebar-border px-1.5 pt-3">
            <div className="flex h-7.5 w-7.5 flex-none items-center justify-center rounded-[10px] bg-sidebar-accent text-xs font-semibold text-sidebar-accent-foreground">
              {initials(session.user.name ?? "?")}
            </div>
            <div className="min-w-0">
              <div className="truncate text-[12.5px] font-semibold text-sidebar-foreground">
                {session.user.name}
              </div>
              <div className="truncate text-[11px] text-[#74747C]">
                {roleLabel(session.user.role, displayBranchName)}
              </div>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-col overflow-hidden">
        <header className="flex flex-none items-center justify-between gap-3 border-b border-border bg-background/85 px-6 py-3 backdrop-blur">
          {isOrgWideRole && branches.length > 1 ? (
            <BranchSwitcher branches={branches} currentBranchId={currentBranchId} />
          ) : (
            <span className="font-mono text-[11px] tracking-[0.06em] text-muted-foreground uppercase">
              {organization.name}
            </span>
          )}
          <div className="flex items-center gap-2">
            <QuickActionMenu />
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/login" });
              }}
            >
              <Button type="submit" variant="outline" size="sm">
                Sign out
              </Button>
            </form>
          </div>
        </header>
        <main className="min-h-0 flex-1 overflow-y-auto p-6">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
