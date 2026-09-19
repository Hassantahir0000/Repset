import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { rawPrisma, tenantDb, type TenantContext } from "@/lib/prisma";

describe("tenant isolation: invoices & payments", () => {
  let orgA: { id: string };
  let orgB: { id: string };
  let branchA1: { id: string };
  let branchA2: { id: string };
  let branchB1: { id: string };
  let memberA1: { id: string };
  let invoiceA1: { id: string };
  let invoiceA2: { id: string };
  let invoiceB1: { id: string };
  let paymentA1: { id: string };
  let paymentB1: { id: string };

  let ownerCtxA: TenantContext;
  let receptionistCtxA1: TenantContext;

  beforeAll(async () => {
    orgA = await rawPrisma.organization.create({
      data: { name: "Billing Isolation Org A", slug: `iso-bill-a-${Date.now()}` },
    });
    orgB = await rawPrisma.organization.create({
      data: { name: "Billing Isolation Org B", slug: `iso-bill-b-${Date.now()}` },
    });
    branchA1 = await rawPrisma.branch.create({ data: { organizationId: orgA.id, name: "A Branch 1" } });
    branchA2 = await rawPrisma.branch.create({ data: { organizationId: orgA.id, name: "A Branch 2" } });
    branchB1 = await rawPrisma.branch.create({ data: { organizationId: orgB.id, name: "B Branch 1" } });

    memberA1 = await rawPrisma.member.create({
      data: {
        organizationId: orgA.id,
        branchId: branchA1.id,
        memberCode: `TEST-BILL-A1-${Date.now()}`,
        firstName: "Zara",
        lastName: "A1",
        phone: "0300-3330001",
      },
    });
    const memberA2 = await rawPrisma.member.create({
      data: {
        organizationId: orgA.id,
        branchId: branchA2.id,
        memberCode: `TEST-BILL-A2-${Date.now()}`,
        firstName: "Zain",
        lastName: "A2",
        phone: "0300-3330002",
      },
    });
    const memberB1 = await rawPrisma.member.create({
      data: {
        organizationId: orgB.id,
        branchId: branchB1.id,
        memberCode: `TEST-BILL-B1-${Date.now()}`,
        firstName: "Bushra",
        lastName: "B1",
        phone: "0300-3330003",
      },
    });

    const dueDate = new Date(Date.now() + 7 * 86400000);

    invoiceA1 = await rawPrisma.invoice.create({
      data: {
        organizationId: orgA.id,
        branchId: branchA1.id,
        memberId: memberA1.id,
        invoiceNumber: `TEST-INV-A1-${Date.now()}`,
        dueDate,
        subtotal: 1000,
        totalAmount: 1000,
      },
    });
    invoiceA2 = await rawPrisma.invoice.create({
      data: {
        organizationId: orgA.id,
        branchId: branchA2.id,
        memberId: memberA2.id,
        invoiceNumber: `TEST-INV-A2-${Date.now()}`,
        dueDate,
        subtotal: 2000,
        totalAmount: 2000,
      },
    });
    invoiceB1 = await rawPrisma.invoice.create({
      data: {
        organizationId: orgB.id,
        branchId: branchB1.id,
        memberId: memberB1.id,
        invoiceNumber: `TEST-INV-B1-${Date.now()}`,
        dueDate,
        subtotal: 3000,
        totalAmount: 3000,
      },
    });

    paymentA1 = await rawPrisma.payment.create({
      data: {
        organizationId: orgA.id,
        branchId: branchA1.id,
        invoiceId: invoiceA1.id,
        memberId: memberA1.id,
        amount: 500,
        method: "CASH",
        receiptNumber: `TEST-RCT-A1-${Date.now()}`,
        recordedByUserId: "test-user",
      },
    });
    paymentB1 = await rawPrisma.payment.create({
      data: {
        organizationId: orgB.id,
        branchId: branchB1.id,
        invoiceId: invoiceB1.id,
        memberId: memberB1.id,
        amount: 1000,
        method: "CASH",
        receiptNumber: `TEST-RCT-B1-${Date.now()}`,
        recordedByUserId: "test-user",
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

  it("invoices: org-wide role sees invoices across its own branches but never another org's", async () => {
    const invoices = await tenantDb(ownerCtxA).invoice.findMany({});
    const ids = invoices.map((i) => i.id);
    expect(ids).toContain(invoiceA1.id);
    expect(ids).toContain(invoiceA2.id);
    expect(ids).not.toContain(invoiceB1.id);
  });

  it("invoices: a branch-scoped role sees only its own branch's invoices", async () => {
    const invoices = await tenantDb(receptionistCtxA1).invoice.findMany({});
    const ids = invoices.map((i) => i.id);
    expect(ids).toContain(invoiceA1.id);
    expect(ids).not.toContain(invoiceA2.id);
    expect(ids).not.toContain(invoiceB1.id);
  });

  it("invoices: findFirst cannot fetch another organization's invoice by exact id", async () => {
    const found = await tenantDb(ownerCtxA).invoice.findFirst({ where: { id: invoiceB1.id } });
    expect(found).toBeNull();
  });

  it("payments: a branch-scoped role cannot see another branch's or another org's payments", async () => {
    const payments = await tenantDb(receptionistCtxA1).payment.findMany({});
    const ids = payments.map((p) => p.id);
    expect(ids).toContain(paymentA1.id);
    expect(ids).not.toContain(paymentB1.id);
  });

  it("payments: findFirst cannot fetch another organization's payment by exact id", async () => {
    const found = await tenantDb(ownerCtxA).payment.findFirst({ where: { id: paymentB1.id } });
    expect(found).toBeNull();
  });
});
