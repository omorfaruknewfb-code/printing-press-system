"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/permissions";
import { expenseInputSchema, ExpenseInput } from "@/lib/validators/expense";

type ActionResult = { success: true } | { success: false; error: string };

export async function createExpense(rawInput: ExpenseInput): Promise<ActionResult> {
  const admin = await requireRole("ADMIN");

  const parsed = expenseInputSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }
  const input = parsed.data;

  try {
    await prisma.expense.create({
      data: {
        date: new Date(input.date),
        category: input.category,
        amount: input.amount,
        description: input.description,
        createdById: admin.id,
      },
    });

    revalidatePath("/expenses");
    revalidatePath("/reports");
    return { success: true };
  } catch (error) {
    console.error("createExpense failed:", error);
    return { success: false, error: "Could not save the expense." };
  }
}

export async function updateExpense(expenseId: string, rawInput: ExpenseInput): Promise<ActionResult> {
  await requireRole("ADMIN");

  const parsed = expenseInputSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }
  const input = parsed.data;

  try {
    await prisma.expense.update({
      where: { id: expenseId },
      data: {
        date: new Date(input.date),
        category: input.category,
        amount: input.amount,
        description: input.description,
      },
    });

    revalidatePath("/expenses");
    revalidatePath("/reports");
    return { success: true };
  } catch (error) {
    console.error("updateExpense failed:", error);
    return { success: false, error: "Could not update the expense." };
  }
}

export async function deleteExpense(expenseId: string): Promise<ActionResult> {
  await requireRole("ADMIN");

  try {
    await prisma.expense.delete({ where: { id: expenseId } });
    revalidatePath("/expenses");
    revalidatePath("/reports");
    return { success: true };
  } catch (error) {
    console.error("deleteExpense failed:", error);
    return { success: false, error: "Could not delete the expense." };
  }
}
