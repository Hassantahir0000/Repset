import { getTenantContext } from "@/lib/tenant";
import { tenantDb } from "@/lib/prisma";

export async function listBranches() {
  const ctx = await getTenantContext();
  const db = tenantDb(ctx);
  return db.branch.findMany({ orderBy: { createdAt: "asc" } });
}
