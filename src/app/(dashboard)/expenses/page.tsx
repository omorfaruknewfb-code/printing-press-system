import { getExpenses } from "@/lib/expenses-data";
import { getExpenseCategories } from "@/lib/expense-categories-data";
import { ExpensesTable } from "@/components/expenses/expenses-table";

interface PageProps {
  searchParams: { category?: string; dateFrom?: string; dateTo?: string };
}

export default async function ExpensesPage({ searchParams }: PageProps) {
  const [expenses, categories] = await Promise.all([
    getExpenses(searchParams),
    getExpenseCategories(),
  ]);

  const plainExpenses = expenses.map((e) => ({
    id: e.id,
    date: e.date.toISOString().slice(0, 10),
    category: e.category,
    amount: Number(e.amount),
    description: e.description ?? "",
    createdByName: e.createdBy.name,
  }));

  const total = plainExpenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Expenses</h1>
        <p className="text-sm text-gray-500">
          {plainExpenses.length} record(s) — Total ৳{total.toLocaleString("en-BD")}
        </p>
      </div>

      <ExpensesTable expenses={plainExpenses} categories={categories} />
    </div>
  );
}
