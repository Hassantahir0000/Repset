import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { rawPrisma, tenantDb, type TenantContext } from "@/lib/prisma";

describe("tenant isolation: branches", () => {
  let orgA: { id: string };
  let orgB: { id: string };
  let branchA: { id: string };
  let branchB: { id: string };
  let ctxA: TenantContext;

  beforeAll(async () => {
    orgA = await rawPrisma.organization.create({
      data: { name: "Isolation Test Org A", slug: `iso-test-a-${Date.now()}` },
    });
    orgB = await rawPrisma.organization.create({
      data: { name: "Isolation Test Org B", slug: `iso-test-b-${Date.now()}` },
    });
    branchA = await rawPrisma.branch.create({
      data: { organizationId: orgA.id, name: "Org A Branch" },
    });
    branchB = await rawPrisma.branch.create({
      data: { organizationId: orgB.id, name: "Org B Branch" },
    });

    ctxA = {
      organizationId: orgA.id,
      userId: "test-user-a",
      role: "OWNER",
      activeBranchId: null,
      accessibleBranchIds: [branchA.id],
    };
  });

  afterAll(async () => {
    // Cascades delete the branches (and would cascade users, if any were created).
    // Deliberately not calling rawPrisma.$disconnect() here: the client is a
    // process-wide singleton shared with other test files running in the
    // same worker, so disconnecting it here would break their queries too.
    await rawPrisma.organization.deleteMany({ where: { id: { in: [orgA.id, orgB.id] } } });
  });

  it("findMany only returns the caller's own organization's branches", async () => {
    const db = tenantDb(ctxA);
    const branches = await db.branch.findMany({});

    expect(branches.some((b) => b.id === branchA.id)).toBe(true);
    expect(branches.some((b) => b.id === branchB.id)).toBe(false);
  });

  it("findFirst cannot fetch another organization's branch even by exact id", async () => {
    const db = tenantDb(ctxA);
    const found = await db.branch.findFirst({ where: { id: branchB.id } });
    expect(found).toBeNull();
  });

  it("create silently re-stamps organizationId, ignoring a spoofed value", async () => {
    const db = tenantDb(ctxA);
    const created = await db.branch.create({
      data: { organizationId: orgB.id, name: "Attempted Cross-Tenant Branch" },
    });

    expect(created.organizationId).toBe(orgA.id);
    expect(created.organizationId).not.toBe(orgB.id);
  });

  it("rawPrisma (unscoped) can still see both orgs' branches — confirms the extension, not the data, provides isolation", async () => {
    const branches = await rawPrisma.branch.findMany({
      where: { organizationId: { in: [orgA.id, orgB.id] } },
    });
    const orgIds = new Set(branches.map((b) => b.organizationId));
    expect(orgIds.has(orgA.id)).toBe(true);
    expect(orgIds.has(orgB.id)).toBe(true);
  });
});
