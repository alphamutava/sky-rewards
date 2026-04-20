import { z } from "zod";

export const depositSchema = z.object({
  amount: z.number().min(1000, "Minimum deposit is KES 1,000").max(500000),
  phoneNumber: z.string().regex(/^254\d{9}$/, "Phone must be in format 254XXXXXXXXX"),
});

export const withdrawSchema = z.object({
  amount: z.number().min(500, "Minimum withdrawal is KES 500").max(150000),
  phoneNumber: z.string().regex(/^254\d{9}$/, "Phone must be in format 254XXXXXXXXX"),
  withdrawalPin: z.string().length(4).optional(),
});

export const setPinSchema = z.object({
  pin: z.string().length(4).regex(/^\d{4}$/, "PIN must be 4 digits"),
});

export type DepositInput = z.infer<typeof depositSchema>;
export type WithdrawInput = z.infer<typeof withdrawSchema>;
