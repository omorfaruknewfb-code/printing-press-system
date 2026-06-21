import { z } from "zod";

export const paymentInputSchema = z.object({
  customerId: z.string().min(1),
  orderId: z.string().optional().nullable(),
  paidAmount: z.coerce.number().positive("Paid amount must be greater than 0"),
  paymentDate: z.string().min(1, "Payment date is required"),
  remarks: z.string().optional(),
});

export type PaymentInput = z.infer<typeof paymentInputSchema>;
