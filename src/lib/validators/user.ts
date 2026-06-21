import { z } from "zod";

export const createUserSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["ADMIN", "STAFF"]),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;

export const updateUserSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Enter a valid email address"),
  password: z.union([z.string().min(6, "Password must be at least 6 characters"), z.literal("")]),
  role: z.enum(["ADMIN", "STAFF"]),
  commissionRate: z.coerce
    .number()
    .min(0, "Commission rate cannot be negative")
    .max(100, "Commission rate cannot exceed 100%"),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;
