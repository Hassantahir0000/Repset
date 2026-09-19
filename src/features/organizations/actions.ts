"use server";

import bcrypt from "bcryptjs";
import { rawPrisma } from "@/lib/prisma";
import {
  createOrganizationWithOwnerSchema,
  type CreateOrganizationWithOwnerInput,
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
