import { z } from "zod";

export const expenseCategoryInputSchema = z.object({
  name: z.string().min(1, "Category name is required").max(60, "Keep it under 60 characters"),
});

export type ExpenseCategoryInput = z.infer<typeof expenseCategoryInputSchema>;
