import { auth } from "@/lib/auth";
import type { TenantContext } from "@/lib/prisma";
import type { Role } from "@/generated/prisma/enums";

export class UnauthenticatedError extends Error {
  constructor() {
    super("No authenticated session");
    this.name = "UnauthenticatedError";
  }
}

/**
 * Resolves the current request's tenant context from the NextAuth session.
 * Every Server Action and Route Handler touching tenant-owned data must
 * call this first, then pass the result to tenantDb() and requirePermission().
 */
export async function getTenantContext(): Promise<TenantContext> {
  const session = await auth();
  if (!session?.user) throw new UnauthenticatedError();

  return {
    organizationId: session.user.organizationId,
    userId: session.user.id,
    role: session.user.role,
    activeBranchId: session.user.activeBranchId,
    accessibleBranchIds: session.user.accessibleBranchIds,
  };
}

export function requireRole(ctx: TenantContext, ...roles: Role[]): void {
  if (!roles.includes(ctx.role)) {
    throw new Error(`Requires one of roles [${roles.join(", ")}], got ${ctx.role}`);
  }
}
