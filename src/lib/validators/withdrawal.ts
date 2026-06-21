import { z } from "zod";

export const withdrawalInputSchema = z.object({
  type: z.enum(["COMMISSION", "SALARY", "OTHER"]),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  date: z.string().min(1, "Date is required"),
  remarks: z.string().optional(),
});

export type WithdrawalInput = z.infer<typeof withdrawalInputSchema>;
