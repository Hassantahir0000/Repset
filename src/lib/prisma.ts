import { PrismaClient } from "@/generated/prisma/client";
import type { Role } from "@/generated/prisma/enums";

declare global {
  var __prisma: PrismaClient | undefined;
}

/**
 * Unscoped client. Reserved for platform-admin tooling and the auth layer
 * itself (which must look up a user before a tenant context exists).
 * Never import this inside src/features/** — use `tenantDb()` instead.
 */
export const rawPrisma = globalThis.__prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.__prisma = rawPrisma;
}

export type TenantContext = {
  organizationId: string;
  userId: string;
  role: Role;
  activeBranchId: string | null;
  accessibleBranchIds: string[];
};

// Models scoped by organizationId only, vs. organizationId + branchId.
// Add an entry here whenever a new tenant-owned model is introduced.
const ORG_ONLY_MODELS = new Set(["Branch", "User"]);
const ORG_AND_BRANCH_MODELS = new Set(["Member"]);

function scopeWhere(
  model: string,
  where: Record<string, unknown> | undefined,
  ctx: TenantContext,
): Record<string, unknown> | undefined {
  if (ORG_AND_BRANCH_MODELS.has(model)) {
    return {
      ...where,
      organizationId: ctx.organizationId,
      branchId: { in: ctx.accessibleBranchIds },
    };
  }
  if (ORG_ONLY_MODELS.has(model)) {
    return { ...where, organizationId: ctx.organizationId };
  }
  return where;
}

export class TenantScopeViolationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TenantScopeViolationError";
  }
}

function scopeCreateData(model: string, data: unknown, ctx: TenantContext): unknown {
  if (!data || typeof data !== "object" || Array.isArray(data)) return data;

  if (ORG_AND_BRANCH_MODELS.has(model)) {
    // branchId isn't forced to a single value (an OWNER/ACCOUNTANT can act
    // across several branches), but it must be one the caller can access.
    const branchId = (data as { branchId?: string }).branchId;
    if (!branchId || !ctx.accessibleBranchIds.includes(branchId)) {
      throw new TenantScopeViolationError(
        `branchId "${branchId ?? "(missing)"}" is not one of the caller's accessible branches`,
      );
    }
    return { ...data, organizationId: ctx.organizationId };
  }

  if (ORG_ONLY_MODELS.has(model)) {
    return { ...data, organizationId: ctx.organizationId };
  }

  return data;
}

const READ_OPS = new Set(["findMany", "findFirst", "findUnique", "count", "aggregate", "groupBy"]);

/**
 * Returns a Prisma client extended so every operation against a tenant-owned
 * model is automatically filtered/stamped with the caller's organizationId
 * (and branchId, for branch-scoped models). This makes cross-tenant reads
 * and writes structurally impossible rather than relying on every Server
 * Action remembering to filter manually.
 */
export function tenantDb(ctx: TenantContext) {
  return rawPrisma.$extends({
    name: "tenant-scope",
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          const isScoped = ORG_ONLY_MODELS.has(model) || ORG_AND_BRANCH_MODELS.has(model);
          if (!isScoped) return query(args);

          // `mutable` aliases the same object as `args`; mutating it in place
          // (rather than passing a differently-shaped object to `query`) keeps
          // `args`'s original per-operation type intact for the `query()` call.
          const mutable = args as { where?: Record<string, unknown>; data?: unknown };

          if (READ_OPS.has(operation)) {
            mutable.where = scopeWhere(model, mutable.where, ctx);
          } else if (operation === "create") {
            mutable.data = scopeCreateData(model, mutable.data, ctx);
          } else if (operation === "createMany") {
            const dataArr = mutable.data as unknown[] | undefined;
            if (Array.isArray(dataArr)) {
              mutable.data = dataArr.map((d) => scopeCreateData(model, d, ctx));
            }
          } else if ("where" in mutable) {
            // update/upsert/delete (single-record) must always be preceded by
            // a tenant-scoped findFirstOrThrow in the calling Server Action,
            // then re-targeted by primary key. We still defensively scope
            // `where` here so a forgotten guard fails closed instead of open.
            mutable.where = scopeWhere(model, mutable.where, ctx);
          }

          return query(args);
        },
      },
    },
  });
}
