import { getTenantContext } from "@/lib/tenant";
import { rawPrisma } from "@/lib/prisma";

export default async function DashboardPage() {
  const ctx = await getTenantContext();

  const organization = await rawPrisma.organization.findUniqueOrThrow({
    where: { id: ctx.organizationId },
  });
  const branchCount = await rawPrisma.branch.count({
    where: { organizationId: ctx.organizationId },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">{organization.name}</h1>
        <p className="text-sm text-gray-500">
          {branchCount} {branchCount === 1 ? "branch" : "branches"} &middot; role: {ctx.role}
        </p>
      </div>

      <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">
        Members, memberships, attendance, and billing modules land here in the next build steps
        (GMS-004 onward).
      </div>
    </div>
  );
}
