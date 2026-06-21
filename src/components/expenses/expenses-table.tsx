"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ExpenseForm } from "@/components/expenses/expense-form";
import { ExpenseCategoriesManager } from "@/components/expenses/expense-categories-manager";
import { deleteExpense } from "@/actions/expense-actions";

interface PlainExpense {
  id: string;
  date: string;
  category: string;
  amount: number;
  description: string;
  createdByName: string;
}

interface PlainCategory {
  id: string;
  name: string;
}

function formatMoney(value: number) {
  return `৳${value.toLocaleString("en-BD")}`;
}

export function ExpensesTable({
  expenses,
  categories,
}: {
  expenses: PlainExpense[];
  categories: PlainCategory[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [addOpen, setAddOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<PlainExpense | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "ALL") params.set(key, value);
    else params.delete(key);
    router.push(`/expenses?${params.toString()}`);
  }

  async function handleDelete(expense: PlainExpense) {
    const confirmed = window.confirm(`Delete this ${expense.category} expense of ${formatMoney(expense.amount)}?`);
    if (!confirmed) return;

    setDeletingId(expense.id);
    const result = await deleteExpense(expense.id);
    setDeletingId(null);

    if (!result.success) {
      alert(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <ExpenseCategoriesManager categories={categories} />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Select
            defaultValue={searchParams.get("category") ?? "ALL"}
            onChange={(e) => updateParam("category", e.target.value)}
            className="sm:w-44"
          >
            <option value="ALL">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </Select>
          <Input
            type="date"
            defaultValue={searchParams.get("dateFrom") ?? ""}
            onChange={(e) => updateParam("dateFrom", e.target.value)}
            className="sm:w-40"
          />
          <Input
            type="date"
            defaultValue={searchParams.get("dateTo") ?? ""}
            onChange={(e) => updateParam("dateTo", e.target.value)}
            className="sm:w-40"
          />
        </div>

        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Add Expense
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Expense</DialogTitle>
            </DialogHeader>
            <ExpenseForm
              mode="create"
              categories={categories}
              onSuccess={() => {
                setAddOpen(false);
                router.refresh();
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full min-w-[800px] text-sm">
            <thead className="border-b border-gray-100 bg-gray-50 text-left text-xs font-medium uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">Recorded By</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {expenses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-gray-500">
                    No expenses found for the current filters.
                  </td>
                </tr>
              ) : (
                expenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-700">{expense.date}</td>
                    <td className="px-4 py-3 text-gray-700">{expense.category}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{formatMoney(expense.amount)}</td>
                    <td className="px-4 py-3 text-gray-700">{expense.description || "—"}</td>
                    <td className="px-4 py-3 text-gray-700">{expense.createdByName}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setEditingExpense(expense)}
                          className="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-[#1E40AF]"
                          aria-label="Edit expense"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(expense)}
                          disabled={deletingId === expense.id}
                          className="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-red-600"
                          aria-label="Delete expense"
                        >
                          {deletingId === expense.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Dialog open={!!editingExpense} onOpenChange={(open) => !open && setEditingExpense(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Expense</DialogTitle>
          </DialogHeader>
          {editingExpense && (
            <ExpenseForm
              mode="edit"
              expenseId={editingExpense.id}
              initialValues={editingExpense}
              categories={categories}
              onSuccess={() => {
                setEditingExpense(null);
                router.refresh();
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
