import { z } from "zod";

// Member photos are stored as data: URLs for the MVP (no object storage
// wired up yet). Capped well under Postgres/row-size concerns; move to
// Vercel Blob or S3 before this becomes a real bottleneck.
const MAX_PHOTO_DATA_URL_LENGTH = 2_000_000;

const photoUrlSchema = z
  .string()
  .max(MAX_PHOTO_DATA_URL_LENGTH, "Photo is too large")
  .refine((v) => v.startsWith("data:image/"), "Photo must be an image")
  .optional()
  .or(z.literal(""));

export const createMemberSchema = z.object({
  branchId: z.string().min(1, "Branch is required"),
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  email: z.string().trim().toLowerCase().email().optional().or(z.literal("")),
  phone: z.string().trim().min(6).max(30),
  dateOfBirth: z.string().trim().optional().or(z.literal("")),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional().or(z.literal("")),
  address: z.string().trim().max(300).optional().or(z.literal("")),
  photoUrl: photoUrlSchema,
});
export type CreateMemberInput = z.infer<typeof createMemberSchema>;

export const updateMemberSchema = createMemberSchema.partial().extend({
  status: z.enum(["ACTIVE", "INACTIVE", "FROZEN"]).optional(),
});
export type UpdateMemberInput = z.infer<typeof updateMemberSchema>;
