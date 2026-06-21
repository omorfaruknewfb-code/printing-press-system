"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/permissions";
import { expenseCategoryInputSchema, ExpenseCategoryInput } from "@/lib/validators/expense-category";

type ActionResult = { success: true } | { success: false; error: string };

export async function createExpenseCategory(rawInput: ExpenseCategoryInput): Promise<ActionResult> {
  await requireRole("ADMIN");

  const parsed = expenseCategoryInputSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }
  const input = parsed.data;

  const existing = await prisma.expenseCategory.findUnique({ where: { name: input.name } });
  if (existing) {
    return { success: false, error: "This category already exists." };
  }

  try {
    await prisma.expenseCategory.create({ data: { name: input.name } });
    revalidatePath("/expenses");
    return { success: true };
  } catch (error) {
    console.error("createExpenseCategory failed:", error);
    return { success: false, error: "Could not create the category." };
  }
}

/**
 * Renaming a category also renames it on every existing Expense row that
 * used the old name, so historical records and Reports stay consistent
 * (Expense.category is a plain string, not a foreign key).
 */
export async function renameExpenseCategory(
  categoryId: string,
  rawInput: ExpenseCategoryInput
): Promise<ActionResult> {
  await requireRole("ADMIN");

  const parsed = expenseCategoryInputSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }
  const input = parsed.data;

  const category = await prisma.expenseCategory.findUnique({ where: { id: categoryId } });
  if (!category) {
    return { success: false, error: "Category not found." };
  }

  const duplicate = await prisma.expenseCategory.findFirst({
    where: { name: input.name, NOT: { id: categoryId } },
  });
  if (duplicate) {
    return { success: false, error: "Another category already uses this name." };
  }

  try {
    await prisma.$transaction([
      prisma.expenseCategory.update({ where: { id: categoryId }, data: { name: input.name } }),
      prisma.expense.updateMany({ where: { category: category.name }, data: { category: input.name } }),
    ]);

    revalidatePath("/expenses");
    revalidatePath("/reports");
    return { success: true };
  } catch (error) {
    console.error("renameExpenseCategory failed:", error);
    return { success: false, error: "Could not rename the category." };
  }
}

export async function deleteExpenseCategory(categoryId: string): Promise<ActionResult> {
  await requireRole("ADMIN");

  const category = await prisma.expenseCategory.findUnique({ where: { id: categoryId } });
  if (!category) {
    return { success: false, error: "Category not found." };
  }

  const usageCount = await prisma.expense.count({ where: { category: category.name } });
  if (usageCount > 0) {
    return {
      success: false,
      error: `This category is used by ${usageCount} expense record(s). Rename it instead, or move those expenses to another category first.`,
    };
  }

  try {
    await prisma.expenseCategory.delete({ where: { id: categoryId } });
    revalidatePath("/expenses");
    return { success: true };
  } catch (error) {
    console.error("deleteExpenseCategory failed:", error);
    return { success: false, error: "Could not delete the category." };
  }
}
