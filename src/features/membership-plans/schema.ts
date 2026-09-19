import { z } from "zod";

const durationTypes = ["MONTHLY", "QUARTERLY", "ANNUAL", "CUSTOM"] as const;

export const createPlanSchema = z.object({
  branchId: z.string().optional().or(z.literal("")),
  name: z.string().trim().min(2).max(120),
  durationType: z.enum(durationTypes),
  durationDays: z.coerce.number().int().min(1).max(3650),
  price: z.coerce.number().min(0),
  registrationFee: z.coerce.number().min(0).optional(),
});
export type CreatePlanInput = z.infer<typeof createPlanSchema>;

export const updatePlanSchema = createPlanSchema.partial().extend({
  isActive: z.boolean().optional(),
});
export type UpdatePlanInput = z.infer<typeof updatePlanSchema>;
