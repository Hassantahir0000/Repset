import { getTenantContext } from "@/lib/tenant";
import { tenantDb } from "@/lib/prisma";
import type { MemberStatus } from "@/generated/prisma/enums";

export async function listMembers(search?: string, status?: MemberStatus) {
  const ctx = await getTenantContext();
  const db = tenantDb(ctx);

  const where = {
    ...(status ? { status } : {}),
    ...(search
      ? {
          OR: [
            { firstName: { contains: search, mode: "insensitive" as const } },
            { lastName: { contains: search, mode: "insensitive" as const } },
            { phone: { contains: search } },
            { email: { contains: search, mode: "insensitive" as const } },
            { memberCode: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  return db.member.findMany({
    where,
    include: { branch: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

export async function getMember(memberId: string) {
  const ctx = await getTenantContext();
  const db = tenantDb(ctx);
  return db.member.findFirst({
    where: { id: memberId },
    include: { branch: { select: { id: true, name: true } } },
  });
}

export async function getMemberStatusCounts() {
  const ctx = await getTenantContext();
  const db = tenantDb(ctx);
  const groups = await db.member.groupBy({ by: ["status"], _count: { _all: true } });

  const counts = { ACTIVE: 0, INACTIVE: 0, FROZEN: 0 };
  for (const g of groups) counts[g.status] = g._count._all;
  return { ...counts, total: counts.ACTIVE + counts.INACTIVE + counts.FROZEN };
}

export async function listRecentMembers(limit = 5) {
  const ctx = await getTenantContext();
  const db = tenantDb(ctx);
  return db.member.findMany({
    include: { branch: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}
