import { prisma } from "@/lib/prisma";

export async function getExpenseCategories() {
  const categories = await prisma.expenseCategory.findMany({ orderBy: { name: "asc" } });
  return categories.map((c) => ({ id: c.id, name: c.name }));
}
