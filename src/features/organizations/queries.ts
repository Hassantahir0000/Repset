import { getTenantContext } from "@/lib/tenant";
import { rawPrisma } from "@/lib/prisma";

// Organization is the tenant root itself, not a tenant-owned model, so
// there's nothing for tenantDb() to scope — the ctx.organizationId from the
// session is the only id we ever look up here.
export async function getCurrentOrganization() {
  const ctx = await getTenantContext();
  return rawPrisma.organization.findUniqueOrThrow({ where: { id: ctx.organizationId } });
}
