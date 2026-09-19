import { z } from "zod";

export const createOrganizationWithOwnerSchema = z.object({
  organizationName: z.string().trim().min(2).max(120),
  branchName: z.string().trim().min(2).max(120).default("Main Branch"),
  ownerName: z.string().trim().min(2).max(120),
  ownerEmail: z.string().trim().toLowerCase().email(),
  ownerPassword: z.string().min(8).max(200),
});

export type CreateOrganizationWithOwnerInput = z.infer<typeof createOrganizationWithOwnerSchema>;

export const updateOrganizationSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  timezone: z.string().trim().min(1).max(60).optional(),
  currency: z.string().trim().length(3).toUpperCase().optional(),
});
export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>;
