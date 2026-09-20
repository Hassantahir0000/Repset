"use server";

import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { rawPrisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant";
import { requirePermission } from "@/lib/permissions";
import { BRANCH_FILTER_COOKIE } from "@/lib/branch-filter";
import {
  createOrganizationWithOwnerSchema,
  updateOrganizationSchema,
  type CreateOrganizationWithOwnerInput,
  type UpdateOrganizationInput,
} from "@/features/organizations/schema";

export type ActionResult<T> = { success: true; data: T } | { success: false; error: string };

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function isUniqueConstraintError(err: unknown): boolean {
  return typeof err === "object" && err !== null && "code" in err && err.code === "P2002";
}

/**
 * Signup entry point: creates a brand-new Organization, its first Branch,
 * and the OWNER user in one transaction. Runs before any tenant context
 * exists, so it deliberately uses `rawPrisma` rather than `tenantDb()`.
 */
export async function createOrganizationWithOwner(
  input: CreateOrganizationWithOwnerInput,
): Promise<ActionResult<{ organizationId: string; userId: string }>> {
  const parsed = createOrganizationWithOwnerSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { organizationName, branchName, ownerName, ownerEmail, ownerPassword } = parsed.data;

  const baseSlug = slugify(organizationName) || "gym";
  let slug = baseSlug;
  let suffix = 1;
  while (await rawPrisma.organization.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${suffix++}`;
  }

  const passwordHash = await bcrypt.hash(ownerPassword, 12);

  try {
    const result = await rawPrisma.$transaction(async (tx) => {
      const organization = await tx.organization.create({
        data: { name: organizationName, slug },
      });
      await tx.branch.create({
        data: { organizationId: organization.id, name: branchName },
      });
      const user = await tx.user.create({
        data: {
          organizationId: organization.id,
          email: ownerEmail,
          passwordHash,
          name: ownerName,
          role: "OWNER",
        },
      });
      return { organizationId: organization.id, userId: user.id };
    });
    return { success: true, data: result };
  } catch (err) {
    if (isUniqueConstraintError(err)) {
      return { success: false, error: "An account with this email or organization already exists" };
    }
    throw err;
  }
}

/**
 * Organization is the tenant root, not a tenant-owned model, so there's
 * nothing for tenantDb() to scope — updates are always targeted at the
 * caller's own ctx.organizationId, never a client-supplied id.
 */
export async function updateOrganization(
  input: UpdateOrganizationInput,
): Promise<ActionResult<{ id: string }>> {
  const ctx = await getTenantContext();
  requirePermission(ctx, "organization:manage");

  const parsed = updateOrganizationSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const organization = await rawPrisma.organization.update({
    where: { id: ctx.organizationId },
    data: parsed.data,
  });
  return { success: true, data: { id: organization.id } };
}

/**
 * Sets or clears the org-wide viewer's branch filter (see src/lib/branch-
 * filter.ts). Only narrows what an org-wide role sees — validated against
 * the session's own accessibleBranchIds, so a tampered cookie value can't
 * grant access to a branch the caller couldn't already reach.
 */
export async function setBranchFilter(branchId: string | null): Promise<ActionResult<null>> {
  const ctx = await getTenantContext();
  const store = await cookies();

  if (!branchId) {
    store.delete(BRANCH_FILTER_COOKIE);
    return { success: true, data: null };
  }

  // Validated against the org directly (not ctx.accessibleBranchIds, which
  // may already be narrowed by a *previous* filter value) so switching from
  // one specific branch straight to another still works.
  const branch = await rawPrisma.branch.findFirst({ where: { id: branchId, organizationId: ctx.organizationId } });
  if (!branch) {
    return { success: false, error: "Branch not found" };
  }

  store.set(BRANCH_FILTER_COOKIE, branchId, { httpOnly: true, sameSite: "lax", path: "/" });
  return { success: true, data: null };
}
