"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Loader2, Tag } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  createExpenseCategory,
  renameExpenseCategory,
  deleteExpenseCategory,
} from "@/actions/expense-category-actions";

interface PlainCategory {
  id: string;
  name: string;
}

function CategoryForm({
  mode,
  categoryId,
  initialName,
  onSuccess,
}: {
  mode: "create" | "edit";
  categoryId?: string;
  initialName?: string;
  onSuccess: () => void;
}) {
  const [name, setName] = useState(initialName ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const result =
      mode === "create"
        ? await createExpenseCategory({ name })
        : await renameExpenseCategory(categoryId as string, { name });

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
        <Label htmlFor="categoryName">Category Name</Label>
        <Input id="categoryName" value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
      </div>
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {mode === "create" ? "Add Category" : "Rename Category"}
      </Button>
    </form>
  );
}

export function ExpenseCategoriesManager({ categories }: { categories: PlainCategory[] }) {
  const router = useRouter();
  const [addOpen, setAddOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<PlainCategory | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(category: PlainCategory) {
    const confirmed = window.confirm(`Delete the "${category.name}" category?`);
    if (!confirmed) return;

    setDeletingId(category.id);
    const result = await deleteExpenseCategory(category.id);
    setDeletingId(null);

    if (!result.success) {
      alert(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <div className="rounded-md border border-gray-200 p-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="flex items-center gap-1.5 text-xs font-medium uppercase text-gray-500">
          <Tag className="h-3.5 w-3.5" /> Expense Categories
        </p>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline">
              <Plus className="mr-1.5 h-3.5 w-3.5" /> Add Category
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Expense Category</DialogTitle>
            </DialogHeader>
            <CategoryForm
              mode="create"
              onSuccess={() => {
                setAddOpen(false);
                router.refresh();
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-wrap gap-2">
        {categories.length === 0 ? (
          <p className="text-sm text-gray-400">No categories yet — add one to get started.</p>
        ) : (
          categories.map((c) => (
            <div
              key={c.id}
              className="flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-sm text-gray-700"
            >
              {c.name}
              <button
                onClick={() => setEditingCategory(c)}
                className="rounded p-0.5 text-gray-400 hover:text-[#1E40AF]"
                aria-label={`Rename ${c.name}`}
              >
                <Pencil className="h-3 w-3" />
              </button>
              <button
                onClick={() => handleDelete(c)}
                disabled={deletingId === c.id}
                className="rounded p-0.5 text-gray-400 hover:text-red-600"
                aria-label={`Delete ${c.name}`}
              >
                {deletingId === c.id ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Trash2 className="h-3 w-3" />
                )}
              </button>
            </div>
          ))
        )}
      </div>

      <Dialog open={!!editingCategory} onOpenChange={(open) => !open && setEditingCategory(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Category</DialogTitle>
          </DialogHeader>
          {editingCategory && (
            <CategoryForm
              mode="edit"
              categoryId={editingCategory.id}
              initialName={editingCategory.name}
              onSuccess={() => {
                setEditingCategory(null);
                router.refresh();
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
