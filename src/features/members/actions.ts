"use server";

import { getTenantContext } from "@/lib/tenant";
import { tenantDb, TenantScopeViolationError } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import {
  createMemberSchema,
  updateMemberSchema,
  type CreateMemberInput,
  type UpdateMemberInput,
} from "@/features/members/schema";

export type ActionResult<T> = { success: true; data: T } | { success: false; error: string };

function isUniqueConstraintError(err: unknown): boolean {
  return typeof err === "object" && err !== null && "code" in err && err.code === "P2002";
}

function emptyToUndefined<T extends Record<string, unknown>>(data: T): T {
  const result = { ...data };
  for (const key of Object.keys(result) as (keyof T)[]) {
    if (result[key] === "") result[key] = undefined as T[keyof T];
  }
  return result;
}

async function nextMemberCode(db: ReturnType<typeof tenantDb>): Promise<string> {
  const count = await db.member.count();
  return `GM-${String(count + 1).padStart(5, "0")}`;
}

export async function createMember(input: CreateMemberInput): Promise<ActionResult<{ id: string }>> {
  const ctx = await getTenantContext();
  requirePermission(ctx, "member:manage");

  const parsed = createMemberSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const data = emptyToUndefined(parsed.data);

  const db = tenantDb(ctx);

  // Retry a handful of times in case of a race on the generated code's
  // uniqueness constraint (two concurrent creates in the same org).
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const memberCode = await nextMemberCode(db);
      const member = await db.member.create({
        data: {
          organizationId: ctx.organizationId,
          branchId: data.branchId,
          memberCode,
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone,
          dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
          gender: data.gender || undefined,
          address: data.address,
          photoUrl: data.photoUrl,
        },
      });
      return { success: true, data: { id: member.id } };
    } catch (err) {
      if (isUniqueConstraintError(err) && attempt < 4) continue;
      if (err instanceof TenantScopeViolationError) {
        return { success: false, error: "Selected branch is not accessible to your account" };
      }
      throw err;
    }
  }
  return { success: false, error: "Could not generate a unique member code, please retry" };
}

export async function updateMember(
  memberId: string,
  input: UpdateMemberInput,
): Promise<ActionResult<{ id: string }>> {
  const ctx = await getTenantContext();
  requirePermission(ctx, "member:manage");

  const parsed = updateMemberSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const data = emptyToUndefined(parsed.data);

  const db = tenantDb(ctx);
  // Tenant-scoped existence check before targeting by primary key.
  await db.member.findFirstOrThrow({ where: { id: memberId } });

  const member = await db.member.update({
    where: { id: memberId },
    data: {
      branchId: data.branchId,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
      gender: data.gender || undefined,
      address: data.address,
      photoUrl: data.photoUrl,
      status: data.status,
    },
  });
  return { success: true, data: { id: member.id } };
}
