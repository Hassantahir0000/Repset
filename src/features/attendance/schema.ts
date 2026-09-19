import { z } from "zod";

export const checkInSchema = z.object({
  memberId: z.string().min(1),
  method: z.enum(["MANUAL", "QR"]).optional(),
});
export type CheckInInput = z.infer<typeof checkInSchema>;

export const checkInByCodeSchema = z.object({
  memberCode: z.string().trim().min(1),
});
export type CheckInByCodeInput = z.infer<typeof checkInByCodeSchema>;
