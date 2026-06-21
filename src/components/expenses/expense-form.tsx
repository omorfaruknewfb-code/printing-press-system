"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { createExpense, updateExpense } from "@/actions/expense-actions";
import { ExpenseInput } from "@/lib/validators/expense";

interface ExpenseFormProps {
  mode: "create" | "edit";
  expenseId?: string;
  initialValues?: Partial<ExpenseInput>;
  categories: { id: string; name: string }[];
  onSuccess: () => void;
}

export function ExpenseForm({ mode, expenseId, initialValues, categories, onSuccess }: ExpenseFormProps) {
  const [date, setDate] = useState(initialValues?.date ?? new Date().toISOString().slice(0, 10));
  const [category, setCategory] = useState(initialValues?.category ?? categories[0]?.name ?? "");
  const [amount, setAmount] = useState(String(initialValues?.amount ?? ""));
  const [description, setDescription] = useState(initialValues?.description ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const payload: ExpenseInput = { date, category, amount: Number(amount), description };

    const result =
      mode === "create" ? await createExpense(payload) : await updateExpense(expenseId as string, payload);

    setIsSubmitting(false);

    if (!result.success) {
      setError(result.error);
      return;
    }
    onSuccess();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="date">Date</Label>
        <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="category">Category</Label>
        <Select id="category" value={category} onChange={(e) => setCategory(e.target.value)}>
          {categories.map((c) => (
            <option key={c.id} value={c.name}>
              {c.name}
            </option>
          ))}
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="amount">Amount</Label>
        <Input
          id="amount"
          type="number"
          min={1}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Input id="description" value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {mode === "create" ? "Save Expense" : "Update Expense"}
      </Button>
    </form>
  );
}
