import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { rawPrisma, tenantDb, TenantScopeViolationError, type TenantContext } from "@/lib/prisma";

describe("tenant isolation: members", () => {
  let orgA: { id: string };
  let orgB: { id: string };
  let branchA1: { id: string };
  let branchA2: { id: string };
  let branchB1: { id: string };
  let memberA1: { id: string };
  let memberA2: { id: string };
  let memberB1: { id: string };

  let ownerCtxA: TenantContext; // OWNER at org A, sees all of org A's branches
  let receptionistCtxA1: TenantContext; // RECEPTIONIST at org A, branch A1 only

  beforeAll(async () => {
    orgA = await rawPrisma.organization.create({
      data: { name: "Member Isolation Org A", slug: `iso-mem-a-${Date.now()}` },
    });
    orgB = await rawPrisma.organization.create({
      data: { name: "Member Isolation Org B", slug: `iso-mem-b-${Date.now()}` },
    });
    branchA1 = await rawPrisma.branch.create({ data: { organizationId: orgA.id, name: "A Branch 1" } });
    branchA2 = await rawPrisma.branch.create({ data: { organizationId: orgA.id, name: "A Branch 2" } });
    branchB1 = await rawPrisma.branch.create({ data: { organizationId: orgB.id, name: "B Branch 1" } });

    memberA1 = await rawPrisma.member.create({
      data: {
        organizationId: orgA.id,
        branchId: branchA1.id,
        memberCode: `TEST-A1-${Date.now()}`,
        firstName: "Alice",
        lastName: "A1",
        phone: "0300-0000001",
      },
    });
    memberA2 = await rawPrisma.member.create({
      data: {
        organizationId: orgA.id,
        branchId: branchA2.id,
        memberCode: `TEST-A2-${Date.now()}`,
        firstName: "Ali",
        lastName: "A2",
        phone: "0300-0000002",
      },
    });
    memberB1 = await rawPrisma.member.create({
      data: {
        organizationId: orgB.id,
        branchId: branchB1.id,
        memberCode: `TEST-B1-${Date.now()}`,
        firstName: "Bob",
        lastName: "B1",
        phone: "0300-0000003",
      },
    });

    ownerCtxA = {
      organizationId: orgA.id,
      userId: "test-owner-a",
      role: "OWNER",
      activeBranchId: null,
      accessibleBranchIds: [branchA1.id, branchA2.id],
    };
    receptionistCtxA1 = {
      organizationId: orgA.id,
      userId: "test-receptionist-a1",
      role: "RECEPTIONIST",
      activeBranchId: branchA1.id,
      accessibleBranchIds: [branchA1.id],
    };
  });

  afterAll(async () => {
    // Not calling rawPrisma.$disconnect() — see the note in branches.test.ts.
    await rawPrisma.organization.deleteMany({ where: { id: { in: [orgA.id, orgB.id] } } });
  });

  it("an org-wide role (OWNER) sees members across its own branches but never another org's", async () => {
    const members = await tenantDb(ownerCtxA).member.findMany({});
    const ids = members.map((m) => m.id);
    expect(ids).toContain(memberA1.id);
    expect(ids).toContain(memberA2.id);
    expect(ids).not.toContain(memberB1.id);
  });

  it("a branch-scoped role (RECEPTIONIST) sees only its own branch's members, not a sibling branch in the same org", async () => {
    const members = await tenantDb(receptionistCtxA1).member.findMany({});
    const ids = members.map((m) => m.id);
    expect(ids).toContain(memberA1.id);
    expect(ids).not.toContain(memberA2.id);
    expect(ids).not.toContain(memberB1.id);
  });

  it("findFirst cannot fetch another organization's member by exact id", async () => {
    const found = await tenantDb(ownerCtxA).member.findFirst({ where: { id: memberB1.id } });
    expect(found).toBeNull();
  });

  it("create rejects a branchId outside the caller's accessible branches", async () => {
    await expect(
      tenantDb(receptionistCtxA1).member.create({
        data: {
          organizationId: orgA.id,
          branchId: branchA2.id, // not in receptionistCtxA1.accessibleBranchIds
          memberCode: `TEST-REJECT-${Date.now()}`,
          firstName: "Should",
          lastName: "Reject",
          phone: "0300-0000009",
        },
      }),
    ).rejects.toBeInstanceOf(TenantScopeViolationError);
  });

  it("create silently re-stamps organizationId, ignoring a spoofed value", async () => {
    const created = await tenantDb(receptionistCtxA1).member.create({
      data: {
        organizationId: orgB.id, // spoofed
        branchId: branchA1.id,
        memberCode: `TEST-STAMP-${Date.now()}`,
        firstName: "Stamped",
        lastName: "Correctly",
        phone: "0300-0000010",
      },
    });
    expect(created.organizationId).toBe(orgA.id);
  });
});
