import { getTenantContext } from "@/lib/tenant";
import { tenantDb } from "@/lib/prisma";

export async function listBranches() {
  const ctx = await getTenantContext();
  const db = tenantDb(ctx);
  return db.branch.findMany({ orderBy: { createdAt: "asc" } });
}

/**
 * Branches the *current caller* may assign branch-scoped records (e.g. a
 * new Member) to — narrower than listBranches(), which returns every branch
 * in the org for org-wide settings screens.
 */
export async function listAssignableBranches() {
  const ctx = await getTenantContext();
  const db = tenantDb(ctx);
  return db.branch.findMany({
    where: { id: { in: ctx.accessibleBranchIds }, isActive: true },
    orderBy: { name: "asc" },
  });
}
