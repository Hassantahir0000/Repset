import { z } from "zod";

export const createOrganizationWithOwnerSchema = z.object({
  organizationName: z.string().trim().min(2).max(120),
  branchName: z.string().trim().min(2).max(120).default("Main Branch"),
  ownerName: z.string().trim().min(2).max(120),
  ownerEmail: z.string().trim().toLowerCase().email(),
  ownerPassword: z.string().min(8).max(200),
});

export type CreateOrganizationWithOwnerInput = z.infer<typeof createOrganizationWithOwnerSchema>;
