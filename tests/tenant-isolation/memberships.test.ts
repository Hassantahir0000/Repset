import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { rawPrisma, tenantDb, TenantScopeViolationError, type TenantContext } from "@/lib/prisma";

describe("tenant isolation: memberships & plans", () => {
  let orgA: { id: string };
  let orgB: { id: string };
  let branchA1: { id: string };
  let branchA2: { id: string };
  let branchB1: { id: string };
  let memberA1: { id: string };
  let orgWidePlanA: { id: string };
  let branchPlanA1: { id: string };
  let planB: { id: string };
  let membershipA1: { id: string };
  let membershipB1: { id: string };

  let ownerCtxA: TenantContext;
  let receptionistCtxA1: TenantContext;

  beforeAll(async () => {
    orgA = await rawPrisma.organization.create({
      data: { name: "Membership Isolation Org A", slug: `iso-ms-a-${Date.now()}` },
    });
    orgB = await rawPrisma.organization.create({
      data: { name: "Membership Isolation Org B", slug: `iso-ms-b-${Date.now()}` },
    });
    branchA1 = await rawPrisma.branch.create({ data: { organizationId: orgA.id, name: "A Branch 1" } });
    branchA2 = await rawPrisma.branch.create({ data: { organizationId: orgA.id, name: "A Branch 2" } });
    branchB1 = await rawPrisma.branch.create({ data: { organizationId: orgB.id, name: "B Branch 1" } });

    memberA1 = await rawPrisma.member.create({
      data: {
        organizationId: orgA.id,
        branchId: branchA1.id,
        memberCode: `TEST-MS-A1-${Date.now()}`,
        firstName: "Ayesha",
        lastName: "A1",
        phone: "0300-1110001",
      },
    });

    orgWidePlanA = await rawPrisma.membershipPlan.create({
      data: {
        organizationId: orgA.id,
        branchId: null,
        name: "Org-wide Monthly",
        durationType: "MONTHLY",
        durationDays: 30,
        price: 5000,
      },
    });
    branchPlanA1 = await rawPrisma.membershipPlan.create({
      data: {
        organizationId: orgA.id,
        branchId: branchA2.id,
        name: "Branch A2 Only Plan",
        durationType: "MONTHLY",
        durationDays: 30,
        price: 6000,
      },
    });
    planB = await rawPrisma.membershipPlan.create({
      data: {
        organizationId: orgB.id,
        branchId: null,
        name: "Org B Plan",
        durationType: "MONTHLY",
        durationDays: 30,
        price: 4000,
      },
    });

    membershipA1 = await rawPrisma.membership.create({
      data: {
        organizationId: orgA.id,
        branchId: branchA1.id,
        memberId: memberA1.id,
        planId: orgWidePlanA.id,
        status: "ACTIVE",
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 86400000),
        priceAtPurchase: 5000,
      },
    });
    const memberB1 = await rawPrisma.member.create({
      data: {
        organizationId: orgB.id,
        branchId: branchB1.id,
        memberCode: `TEST-MS-B1-${Date.now()}`,
        firstName: "Bilal",
        lastName: "B1",
        phone: "0300-1110002",
      },
    });
    membershipB1 = await rawPrisma.membership.create({
      data: {
        organizationId: orgB.id,
        branchId: branchB1.id,
        memberId: memberB1.id,
        planId: planB.id,
        status: "ACTIVE",
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 86400000),
        priceAtPurchase: 4000,
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
    await rawPrisma.organization.deleteMany({ where: { id: { in: [orgA.id, orgB.id] } } });
  });

  it("MembershipPlan: caller sees org-wide plans plus plans for their own accessible branches, never another org's", async () => {
    const plans = await tenantDb(receptionistCtxA1).membershipPlan.findMany({});
    const ids = plans.map((p) => p.id);
    expect(ids).toContain(orgWidePlanA.id); // org-wide, visible everywhere in org A
    expect(ids).not.toContain(branchPlanA1.id); // scoped to branch A2, receptionist is at A1
    expect(ids).not.toContain(planB.id); // different org entirely
  });

  it("MembershipPlan: an org-wide role sees both org-wide and all branch-specific plans in its org", async () => {
    const plans = await tenantDb(ownerCtxA).membershipPlan.findMany({});
    const ids = plans.map((p) => p.id);
    expect(ids).toContain(orgWidePlanA.id);
    expect(ids).toContain(branchPlanA1.id);
    expect(ids).not.toContain(planB.id);
  });

  it("MembershipPlan: create rejects a branchId outside the caller's accessible branches", async () => {
    await expect(
      tenantDb(receptionistCtxA1).membershipPlan.create({
        data: {
          organizationId: orgA.id,
          branchId: branchA2.id,
          name: "Should reject",
          durationType: "MONTHLY",
          durationDays: 30,
          price: 1000,
        },
      }),
    ).rejects.toBeInstanceOf(TenantScopeViolationError);
  });

  it("MembershipPlan: create allows a null (org-wide) branchId", async () => {
    const created = await tenantDb(receptionistCtxA1).membershipPlan.create({
      data: {
        organizationId: orgB.id, // spoofed — should be re-stamped
        branchId: null,
        name: "Receptionist-created org-wide plan",
        durationType: "MONTHLY",
        durationDays: 30,
        price: 2000,
      },
    });
    expect(created.organizationId).toBe(orgA.id);
    expect(created.branchId).toBeNull();
  });

  it("Membership: org-wide role sees memberships across its own branches but never another org's", async () => {
    const memberships = await tenantDb(ownerCtxA).membership.findMany({});
    const ids = memberships.map((m) => m.id);
    expect(ids).toContain(membershipA1.id);
    expect(ids).not.toContain(membershipB1.id);
  });

  it("Membership: findFirst cannot fetch another organization's membership by exact id", async () => {
    const found = await tenantDb(ownerCtxA).membership.findFirst({ where: { id: membershipB1.id } });
    expect(found).toBeNull();
  });
});
