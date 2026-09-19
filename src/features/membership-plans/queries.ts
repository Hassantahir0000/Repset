import { getTenantContext } from "@/lib/tenant";
import { tenantDb } from "@/lib/prisma";

export async function listPlans() {
  const ctx = await getTenantContext();
  const db = tenantDb(ctx);
  return db.membershipPlan.findMany({
    include: { branch: { select: { name: true } } },
    orderBy: { createdAt: "asc" },
  });
}

export async function listActivePlansForAssignment() {
  const ctx = await getTenantContext();
  const db = tenantDb(ctx);
  return db.membershipPlan.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });
}
