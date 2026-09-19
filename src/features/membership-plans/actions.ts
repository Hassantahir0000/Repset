"use server";

import { getTenantContext } from "@/lib/tenant";
import { tenantDb, TenantScopeViolationError } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { createPlanSchema, updatePlanSchema, type CreatePlanInput, type UpdatePlanInput } from "@/features/membership-plans/schema";

export type ActionResult<T> = { success: true; data: T } | { success: false; error: string };

export async function createPlan(input: CreatePlanInput): Promise<ActionResult<{ id: string }>> {
  const ctx = await getTenantContext();
  requirePermission(ctx, "membership-plan:manage");

  const parsed = createPlanSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { branchId, name, durationType, durationDays, price, registrationFee } = parsed.data;

  const db = tenantDb(ctx);
  try {
    const plan = await db.membershipPlan.create({
      data: {
        organizationId: ctx.organizationId,
        branchId: branchId || null,
        name,
        durationType,
        durationDays,
        price,
        registrationFee: registrationFee ?? 0,
      },
    });
    return { success: true, data: { id: plan.id } };
  } catch (err) {
    if (err instanceof TenantScopeViolationError) {
      return { success: false, error: "Selected branch is not accessible to your account" };
    }
    throw err;
  }
}

export async function updatePlan(
  planId: string,
  input: UpdatePlanInput,
): Promise<ActionResult<{ id: string }>> {
  const ctx = await getTenantContext();
  requirePermission(ctx, "membership-plan:manage");

  const parsed = updatePlanSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { branchId, ...rest } = parsed.data;

  const db = tenantDb(ctx);
  await db.membershipPlan.findFirstOrThrow({ where: { id: planId } });
  const plan = await db.membershipPlan.update({
    where: { id: planId },
    data: { ...rest, ...(branchId !== undefined ? { branchId: branchId || null } : {}) },
  });
  return { success: true, data: { id: plan.id } };
}
