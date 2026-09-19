import { describe, it, expect } from "vitest";
import { hasPermission, requirePermission, ForbiddenError } from "@/lib/permissions";
import type { TenantContext } from "@/lib/prisma";

function ctxWithRole(role: TenantContext["role"]): TenantContext {
  return {
    organizationId: "org-1",
    userId: "user-1",
    role,
    activeBranchId: "branch-1",
    accessibleBranchIds: ["branch-1"],
  };
}

describe("RBAC: member permissions", () => {
  it("TRAINER can view members but cannot create/update them", () => {
    const ctx = ctxWithRole("TRAINER");
    expect(hasPermission(ctx, "member:view")).toBe(true);
    expect(hasPermission(ctx, "member:manage")).toBe(false);
    expect(() => requirePermission(ctx, "member:manage")).toThrow(ForbiddenError);
  });

  it("RECEPTIONIST can view and manage members", () => {
    const ctx = ctxWithRole("RECEPTIONIST");
    expect(hasPermission(ctx, "member:view")).toBe(true);
    expect(hasPermission(ctx, "member:manage")).toBe(true);
    expect(() => requirePermission(ctx, "member:manage")).not.toThrow();
  });

  it("OWNER can manage members and the organization itself", () => {
    const ctx = ctxWithRole("OWNER");
    expect(hasPermission(ctx, "member:manage")).toBe(true);
    expect(hasPermission(ctx, "organization:manage")).toBe(true);
  });

  it("ACCOUNTANT can view members for billing context but cannot manage them", () => {
    const ctx = ctxWithRole("ACCOUNTANT");
    expect(hasPermission(ctx, "member:view")).toBe(true);
    expect(hasPermission(ctx, "member:manage")).toBe(false);
  });
});
