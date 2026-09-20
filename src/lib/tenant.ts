import { auth } from "@/lib/auth";
import type { TenantContext } from "@/lib/prisma";
import type { Role } from "@/generated/prisma/enums";
import { getBranchFilterValue } from "@/lib/branch-filter";

export class UnauthenticatedError extends Error {
  constructor() {
    super("No authenticated session");
    this.name = "UnauthenticatedError";
  }
}

/**
 * Resolves the current request's tenant context from the NextAuth session,
 * narrowed by the caller's branch-filter cookie if they're an org-wide role
 * viewing a single branch. The filter can only narrow accessibleBranchIds
 * to a subset of the session's own list — never widen it — so this stays
 * safe even if the cookie were tampered with. Every Server Action and
 * Route Handler touching tenant-owned data must call this first, then pass
 * the result to tenantDb() and requirePermission().
 */
export async function getTenantContext(): Promise<TenantContext> {
  const session = await auth();
  if (!session?.user) throw new UnauthenticatedError();

  let accessibleBranchIds = session.user.accessibleBranchIds;
  let activeBranchId = session.user.activeBranchId;

  // A role fixed to one branch (activeBranchId already set) has nothing to
  // narrow — the filter only applies to org-wide roles viewing "all branches".
  if (activeBranchId === null) {
    const filter = await getBranchFilterValue();
    if (filter && session.user.accessibleBranchIds.includes(filter)) {
      accessibleBranchIds = [filter];
      activeBranchId = filter;
    }
  }

  return {
    organizationId: session.user.organizationId,
    userId: session.user.id,
    role: session.user.role,
    activeBranchId,
    accessibleBranchIds,
  };
}

export function requireRole(ctx: TenantContext, ...roles: Role[]): void {
  if (!roles.includes(ctx.role)) {
    throw new Error(`Requires one of roles [${roles.join(", ")}], got ${ctx.role}`);
  }
}
