import { redirect } from "next/navigation";
import { auth, signOut } from "@/lib/auth";
import { getCurrentOrganization } from "@/features/organizations/queries";
import { listBranches } from "@/features/branches/queries";
import { getBranchFilterValue } from "@/lib/branch-filter";
import { SidebarNav, type NavGroup } from "@/components/sidebar-nav";
import { BranchSwitcher } from "@/components/branch-switcher";
import { Button } from "@/components/ui/button";

const NAV_GROUPS: NavGroup[] = [
  {
    label: "WORKSPACE",
    items: [
      { href: "/dashboard", label: "Dashboard" },
      { href: "/members", label: "Members" },
      { href: "/attendance", label: "Check-in Desk" },
      { href: "/billing", label: "Billing" },
    ],
  },
  {
    label: "SETTINGS",
    items: [
      { href: "/settings/organization", label: "Organization" },
      { href: "/settings/branches", label: "Branches" },
      { href: "/settings/membership-plans", label: "Membership Plans" },
    ],
  },
];

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

  const organization = await getCurrentOrganization();

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
          <div className="h-[26px] w-[26px] flex-none rounded-lg bg-primary shadow-[0_6px_18px_-6px_rgba(232,70,42,0.8)]" />
          <div className="min-w-0">
            <div className="text-[15px] font-bold tracking-tight text-white">Repset</div>
            <div className="truncate text-[11px] text-[#74747C]">{organization.name}</div>
          </div>
        </div>

        <SidebarNav groups={NAV_GROUPS} />

        <div className="mt-auto flex items-center gap-2.5 border-t border-sidebar-border px-1.5 pt-3">
          <div className="flex h-[30px] w-[30px] flex-none items-center justify-center rounded-[10px] bg-sidebar-accent text-xs font-semibold text-sidebar-accent-foreground">
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
        </header>
        <main className="min-h-0 flex-1 overflow-y-auto p-6">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
