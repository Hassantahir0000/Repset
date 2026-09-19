import { z } from "zod";

export const activateMembershipSchema = z.object({
  memberId: z.string().min(1),
  planId: z.string().min(1),
  startDate: z.string().trim().optional().or(z.literal("")),
  autoRenew: z.boolean().optional(),
});
export type ActivateMembershipInput = z.infer<typeof activateMembershipSchema>;

export const renewMembershipSchema = z.object({
  membershipId: z.string().min(1),
  planId: z.string().min(1).optional(),
});
export type RenewMembershipInput = z.infer<typeof renewMembershipSchema>;
