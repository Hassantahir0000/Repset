"use server";

import { getTenantContext } from "@/lib/tenant";
import { tenantDb } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { createBranchSchema, updateBranchSchema, type CreateBranchInput, type UpdateBranchInput } from "@/features/branches/schema";

export type ActionResult<T> = { success: true; data: T } | { success: false; error: string };

function normalize<T extends { address?: string; phone?: string }>(data: T) {
  return {
    ...data,
    address: data.address === "" ? undefined : data.address,
    phone: data.phone === "" ? undefined : data.phone,
  };
}

export async function createBranch(input: CreateBranchInput): Promise<ActionResult<{ id: string }>> {
  const ctx = await getTenantContext();
  requirePermission(ctx, "branch:manage");

  const parsed = createBranchSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const db = tenantDb(ctx);
  // organizationId is redundant here — tenantDb()'s create hook always
  // re-stamps it from ctx — but Prisma's generated types require the field
  // to be present at the call site, so we pass ctx's own value explicitly.
  const branch = await db.branch.create({
    data: { ...normalize(parsed.data), organizationId: ctx.organizationId },
  });
  return { success: true, data: { id: branch.id } };
}

export async function updateBranch(
  branchId: string,
  input: UpdateBranchInput,
): Promise<ActionResult<{ id: string }>> {
  const ctx = await getTenantContext();
  requirePermission(ctx, "branch:manage");

  const parsed = updateBranchSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const db = tenantDb(ctx);
  // Tenant-scoped existence check before targeting by primary key.
  await db.branch.findFirstOrThrow({ where: { id: branchId } });
  const branch = await db.branch.update({ where: { id: branchId }, data: normalize(parsed.data) });
  return { success: true, data: { id: branch.id } };
}
