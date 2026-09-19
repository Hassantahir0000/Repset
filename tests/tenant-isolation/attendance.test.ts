import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { rawPrisma, tenantDb, type TenantContext } from "@/lib/prisma";

describe("tenant isolation: attendance", () => {
  let orgA: { id: string };
  let orgB: { id: string };
  let branchA1: { id: string };
  let branchA2: { id: string };
  let branchB1: { id: string };
  let memberA1: { id: string };
  let memberA2: { id: string };
  let attendanceA1: { id: string };
  let attendanceA2: { id: string };
  let attendanceB1: { id: string };

  let ownerCtxA: TenantContext;
  let receptionistCtxA1: TenantContext;

  beforeAll(async () => {
    orgA = await rawPrisma.organization.create({
      data: { name: "Attendance Isolation Org A", slug: `iso-att-a-${Date.now()}` },
    });
    orgB = await rawPrisma.organization.create({
      data: { name: "Attendance Isolation Org B", slug: `iso-att-b-${Date.now()}` },
    });
    branchA1 = await rawPrisma.branch.create({ data: { organizationId: orgA.id, name: "A Branch 1" } });
    branchA2 = await rawPrisma.branch.create({ data: { organizationId: orgA.id, name: "A Branch 2" } });
    branchB1 = await rawPrisma.branch.create({ data: { organizationId: orgB.id, name: "B Branch 1" } });

    memberA1 = await rawPrisma.member.create({
      data: {
        organizationId: orgA.id,
        branchId: branchA1.id,
        memberCode: `TEST-ATT-A1-${Date.now()}`,
        firstName: "Ali",
        lastName: "A1",
        phone: "0300-2220001",
      },
    });
    memberA2 = await rawPrisma.member.create({
      data: {
        organizationId: orgA.id,
        branchId: branchA2.id,
        memberCode: `TEST-ATT-A2-${Date.now()}`,
        firstName: "Amna",
        lastName: "A2",
        phone: "0300-2220002",
      },
    });
    const memberB1 = await rawPrisma.member.create({
      data: {
        organizationId: orgB.id,
        branchId: branchB1.id,
        memberCode: `TEST-ATT-B1-${Date.now()}`,
        firstName: "Babar",
        lastName: "B1",
        phone: "0300-2220003",
      },
    });

    attendanceA1 = await rawPrisma.attendance.create({
      data: { organizationId: orgA.id, branchId: branchA1.id, memberId: memberA1.id },
    });
    attendanceA2 = await rawPrisma.attendance.create({
      data: { organizationId: orgA.id, branchId: branchA2.id, memberId: memberA2.id },
    });
    attendanceB1 = await rawPrisma.attendance.create({
      data: { organizationId: orgB.id, branchId: branchB1.id, memberId: memberB1.id },
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

  it("an org-wide role sees attendance across its own branches but never another org's", async () => {
    const records = await tenantDb(ownerCtxA).attendance.findMany({});
    const ids = records.map((r) => r.id);
    expect(ids).toContain(attendanceA1.id);
    expect(ids).toContain(attendanceA2.id);
    expect(ids).not.toContain(attendanceB1.id);
  });

  it("a branch-scoped role sees only its own branch's attendance", async () => {
    const records = await tenantDb(receptionistCtxA1).attendance.findMany({});
    const ids = records.map((r) => r.id);
    expect(ids).toContain(attendanceA1.id);
    expect(ids).not.toContain(attendanceA2.id);
    expect(ids).not.toContain(attendanceB1.id);
  });

  it("findFirst cannot fetch another organization's attendance record by exact id", async () => {
    const found = await tenantDb(ownerCtxA).attendance.findFirst({ where: { id: attendanceB1.id } });
    expect(found).toBeNull();
  });
});
