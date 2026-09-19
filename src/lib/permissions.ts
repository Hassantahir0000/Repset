import type { Role } from "@/generated/prisma/enums";
import type { TenantContext } from "@/lib/prisma";

export type Permission =
  | "organization:manage"
  | "branch:manage"
  | "user:manage"
  | "member:view"
  | "member:manage"
  | "membership:manage"
  | "attendance:record"
  | "billing:manage"
  | "reports:view"
  | "crm:manage";

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  OWNER: [
    "organization:manage",
    "branch:manage",
    "user:manage",
    "member:view",
    "member:manage",
    "membership:manage",
    "attendance:record",
    "billing:manage",
    "reports:view",
    "crm:manage",
  ],
  BRANCH_MANAGER: [
    "branch:manage",
    "user:manage",
    "member:view",
    "member:manage",
    "membership:manage",
    "attendance:record",
    "billing:manage",
    "reports:view",
    "crm:manage",
  ],
  RECEPTIONIST: [
    "member:view",
    "member:manage",
    "membership:manage",
    "attendance:record",
    "billing:manage",
    "crm:manage",
  ],
  TRAINER: ["member:view", "attendance:record"],
  ACCOUNTANT: ["member:view", "billing:manage", "reports:view"],
};

export function hasPermission(ctx: TenantContext, permission: Permission): boolean {
  return ROLE_PERMISSIONS[ctx.role].includes(permission);
}

export class ForbiddenError extends Error {
  constructor(permission: Permission) {
    super(`Missing required permission: ${permission}`);
    this.name = "ForbiddenError";
  }
}

export function requirePermission(ctx: TenantContext, permission: Permission): void {
  if (!hasPermission(ctx, permission)) {
    throw new ForbiddenError(permission);
  }
}
