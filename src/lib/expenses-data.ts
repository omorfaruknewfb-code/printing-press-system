import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

interface ExpenseFilters {
  category?: string;
  dateFrom?: string;
  dateTo?: string;
}

export async function getExpenses(filters: ExpenseFilters) {
  const where: Prisma.ExpenseWhereInput = {};

  if (filters.category && filters.category !== "ALL") {
    where.category = filters.category;
  }

  if (filters.dateFrom || filters.dateTo) {
    where.date = {
      ...(filters.dateFrom ? { gte: new Date(filters.dateFrom) } : {}),
      ...(filters.dateTo ? { lte: new Date(filters.dateTo) } : {}),
    };
  }

  return prisma.expense.findMany({
    where,
    include: { createdBy: { select: { name: true } } },
    orderBy: { date: "desc" },
    take: 200,
  });
}
