"use server";

import { getTenantContext } from "@/lib/tenant";
import { tenantDb } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import {
  activateMembershipSchema,
  renewMembershipSchema,
  type ActivateMembershipInput,
  type RenewMembershipInput,
} from "@/features/memberships/schema";
import {
  addDays,
  computeEndDate,
  applyFreezeExtension,
  canFreeze,
  canResume,
  canCancel,
  canExpire,
  canRenew,
} from "@/features/memberships/logic";
import { createInvoiceRecord, type InvoiceLineItemInput } from "@/features/billing/helpers";

// Invoices are payable same-day at the front desk, but a dueDate equal to
// issueDate would flip to OVERDUE within milliseconds of creation (any
// instant after issuance is already "past" that exact timestamp). A short
// grace window keeps "overdue" meaning what it should: unpaid past the day
// it was due, not unpaid a heartbeat after being raised.
const INVOICE_DUE_GRACE_DAYS = 1;

export type ActionResult<T> = { success: true; data: T } | { success: false; error: string };

export async function activateMembership(
  input: ActivateMembershipInput,
): Promise<ActionResult<{ id: string; invoiceId: string }>> {
  const ctx = await getTenantContext();
  requirePermission(ctx, "membership:manage");

  const parsed = activateMembershipSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { memberId, planId, startDate, autoRenew } = parsed.data;

  const db = tenantDb(ctx);
  const member = await db.member.findFirst({ where: { id: memberId } });
  if (!member) return { success: false, error: "Member not found" };

  const plan = await db.membershipPlan.findFirst({ where: { id: planId, isActive: true } });
  if (!plan) return { success: false, error: "Membership plan not found or inactive" };

  const existingOpen = await db.membership.findFirst({
    where: { memberId, status: { in: ["PENDING", "ACTIVE", "FROZEN"] } },
  });
  if (existingOpen) {
    return { success: false, error: "Member already has an active or frozen membership" };
  }

  const start = startDate ? new Date(startDate) : new Date();
  const end = computeEndDate(start, plan.durationDays);

  const membership = await db.membership.create({
    data: {
      organizationId: ctx.organizationId,
      branchId: member.branchId,
      memberId,
      planId,
      status: "ACTIVE",
      startDate: start,
      endDate: end,
      autoRenew: autoRenew ?? false,
      priceAtPurchase: plan.price,
    },
  });

  // Selling a membership always produces a bill — generated here rather
  // than left to a separate manual step, per the product's Lead -> ...
  // -> Membership -> Invoice -> Payment lifecycle. Registration fee only
  // applies on a fresh activation, never on a renewal.
  const items: InvoiceLineItemInput[] = [
    { description: `${plan.name} membership`, quantity: 1, unitPrice: Number(plan.price), membershipId: membership.id },
  ];
  if (Number(plan.registrationFee) > 0) {
    items.push({ description: "Registration fee", quantity: 1, unitPrice: Number(plan.registrationFee) });
  }
  const invoice = await createInvoiceRecord(db, ctx, {
    memberId,
    branchId: member.branchId,
    items,
    dueDate: addDays(start, INVOICE_DUE_GRACE_DAYS),
  });

  return { success: true, data: { id: membership.id, invoiceId: invoice.id } };
}

export async function renewMembership(
  input: RenewMembershipInput,
): Promise<ActionResult<{ id: string; invoiceId: string }>> {
  const ctx = await getTenantContext();
  requirePermission(ctx, "membership:manage");

  const parsed = renewMembershipSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { membershipId, planId } = parsed.data;

  const db = tenantDb(ctx);
  const membership = await db.membership.findFirst({ where: { id: membershipId } });
  if (!membership) return { success: false, error: "Membership not found" };
  if (!canRenew(membership.status)) {
    return { success: false, error: `Cannot renew a membership with status ${membership.status}` };
  }

  const plan = await db.membershipPlan.findFirst({ where: { id: planId ?? membership.planId } });
  if (!plan) return { success: false, error: "Membership plan not found" };

  const now = new Date();
  const start = membership.endDate.getTime() > now.getTime() ? membership.endDate : now;
  const end = computeEndDate(start, plan.durationDays);

  const renewed = await db.membership.create({
    data: {
      organizationId: ctx.organizationId,
      branchId: membership.branchId,
      memberId: membership.memberId,
      planId: plan.id,
      status: "ACTIVE",
      startDate: start,
      endDate: end,
      autoRenew: membership.autoRenew,
      priceAtPurchase: plan.price,
    },
  });

  if (membership.status === "ACTIVE" || membership.status === "FROZEN") {
    await db.membership.update({ where: { id: membership.id }, data: { status: "EXPIRED" } });
  }

  const invoice = await createInvoiceRecord(db, ctx, {
    memberId: membership.memberId,
    branchId: membership.branchId,
    items: [
      {
        description: `${plan.name} membership renewal`,
        quantity: 1,
        unitPrice: Number(plan.price),
        membershipId: renewed.id,
      },
    ],
    dueDate: addDays(start, INVOICE_DUE_GRACE_DAYS),
  });

  return { success: true, data: { id: renewed.id, invoiceId: invoice.id } };
}

export async function freezeMembership(membershipId: string): Promise<ActionResult<{ id: string }>> {
  const ctx = await getTenantContext();
  requirePermission(ctx, "membership:manage");

  const db = tenantDb(ctx);
  const membership = await db.membership.findFirst({ where: { id: membershipId } });
  if (!membership) return { success: false, error: "Membership not found" };
  if (!canFreeze(membership.status)) {
    return { success: false, error: `Cannot freeze a membership with status ${membership.status}` };
  }

  const updated = await db.membership.update({
    where: { id: membershipId },
    data: { status: "FROZEN", frozenAt: new Date() },
  });
  return { success: true, data: { id: updated.id } };
}

export async function resumeMembership(membershipId: string): Promise<ActionResult<{ id: string }>> {
  const ctx = await getTenantContext();
  requirePermission(ctx, "membership:manage");

  const db = tenantDb(ctx);
  const membership = await db.membership.findFirst({ where: { id: membershipId } });
  if (!membership) return { success: false, error: "Membership not found" };
  if (!canResume(membership.status) || !membership.frozenAt) {
    return { success: false, error: `Cannot resume a membership with status ${membership.status}` };
  }

  const resumedAt = new Date();
  const newEndDate = applyFreezeExtension(membership.endDate, membership.frozenAt, resumedAt);

  const updated = await db.membership.update({
    where: { id: membershipId },
    data: { status: "ACTIVE", freezeResumeAt: resumedAt, endDate: newEndDate },
  });
  return { success: true, data: { id: updated.id } };
}

export async function cancelMembership(membershipId: string): Promise<ActionResult<{ id: string }>> {
  const ctx = await getTenantContext();
  requirePermission(ctx, "membership:manage");

  const db = tenantDb(ctx);
  const membership = await db.membership.findFirst({ where: { id: membershipId } });
  if (!membership) return { success: false, error: "Membership not found" };
  if (!canCancel(membership.status)) {
    return { success: false, error: `Cannot cancel a membership with status ${membership.status}` };
  }

  const updated = await db.membership.update({
    where: { id: membershipId },
    data: { status: "CANCELLED" },
  });
  return { success: true, data: { id: updated.id } };
}

export async function expireMembership(membershipId: string): Promise<ActionResult<{ id: string }>> {
  const ctx = await getTenantContext();
  requirePermission(ctx, "membership:manage");

  const db = tenantDb(ctx);
  const membership = await db.membership.findFirst({ where: { id: membershipId } });
  if (!membership) return { success: false, error: "Membership not found" };
  if (!canExpire(membership.status)) {
    return { success: false, error: `Cannot expire a membership with status ${membership.status}` };
  }

  const updated = await db.membership.update({
    where: { id: membershipId },
    data: { status: "EXPIRED" },
  });
  return { success: true, data: { id: updated.id } };
}
