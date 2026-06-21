import { z } from "zod";

export const expenseInputSchema = z.object({
  date: z.string().min(1, "Date is required"),
  category: z.string().min(1, "Category is required"),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  description: z.string().optional(),
});

export type ExpenseInput = z.infer<typeof expenseInputSchema>;
