import { getTenantContext } from "@/lib/tenant";
import { tenantDb } from "@/lib/prisma";

export async function listMembers(search?: string) {
  const ctx = await getTenantContext();
  const db = tenantDb(ctx);

  const where = search
    ? {
        OR: [
          { firstName: { contains: search, mode: "insensitive" as const } },
          { lastName: { contains: search, mode: "insensitive" as const } },
          { phone: { contains: search } },
          { email: { contains: search, mode: "insensitive" as const } },
          { memberCode: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : undefined;

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
