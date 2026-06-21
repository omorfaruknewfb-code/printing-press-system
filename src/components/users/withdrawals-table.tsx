"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, Loader2 } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { adminUpdateWithdrawal, adminDeleteWithdrawal } from "@/actions/withdrawal-actions";

interface PlainWithdrawal {
  id: string;
  staffId: string;
  staffName: string;
  type: "COMMISSION" | "SALARY" | "OTHER";
  amount: number;
  date: string;
  remarks: string;
  editedByAdmin: boolean;
}

function formatMoney(value: number) {
  return `৳${value.toLocaleString("en-BD")}`;
}

function EditWithdrawalForm({
  withdrawal,
  onSuccess,
}: {
  withdrawal: PlainWithdrawal;
  onSuccess: () => void;
}) {
  const [type, setType] = useState(withdrawal.type);
  const [amount, setAmount] = useState(String(withdrawal.amount));
  const [date, setDate] = useState(withdrawal.date);
  const [remarks, setRemarks] = useState(withdrawal.remarks);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const result = await adminUpdateWithdrawal(withdrawal.id, {
      type,
      amount: Number(amount),
      date,
      remarks,
    });

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
        <Label htmlFor="type">Type</Label>
        <Select id="type" value={type} onChange={(e) => setType(e.target.value as typeof type)}>
          <option value="COMMISSION">Commission</option>
          <option value="SALARY">Salary</option>
          <option value="OTHER">Other</option>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="amount">Amount</Label>
        <Input id="amount" type="number" min={1} value={amount} onChange={(e) => setAmount(e.target.value)} required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="date">Date</Label>
        <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="remarks">Remarks</Label>
        <Input id="remarks" value={remarks} onChange={(e) => setRemarks(e.target.value)} />
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Update Withdrawal
      </Button>
    </form>
  );
}

export function WithdrawalsTable({ withdrawals }: { withdrawals: PlainWithdrawal[] }) {
  const router = useRouter();
  const [editingWithdrawal, setEditingWithdrawal] = useState<PlainWithdrawal | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(withdrawal: PlainWithdrawal) {
    const confirmed = window.confirm(
      `Delete ${withdrawal.staffName}'s ${formatMoney(withdrawal.amount)} ${withdrawal.type.toLowerCase()} withdrawal? This does not remove the linked expense entry.`
    );
    if (!confirmed) return;

    setDeletingId(withdrawal.id);
    const result = await adminDeleteWithdrawal(withdrawal.id);
    setDeletingId(null);

    if (!result.success) {
      alert(result.error);
      return;
    }
    router.refresh();
  }

  if (withdrawals.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-gray-500">
          No withdrawals have been recorded yet.
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full min-w-[800px] text-sm">
            <thead className="border-b border-gray-100 bg-gray-50 text-left text-xs font-medium uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Staff</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Remarks</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {withdrawals.map((w) => (
                <tr key={w.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{w.staffName}</td>
                  <td className="px-4 py-3 text-gray-700">{w.type}</td>
                  <td className="px-4 py-3 text-gray-700">{formatMoney(w.amount)}</td>
                  <td className="px-4 py-3 text-gray-700">{w.date}</td>
                  <td className="px-4 py-3 text-gray-700">
                    {w.remarks || "—"}
                    {w.editedByAdmin && (
                      <span className="ml-2 inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                        Edited by Admin
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setEditingWithdrawal(w)}
                        className="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-[#1E40AF]"
                        aria-label="Edit withdrawal"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(w)}
                        disabled={deletingId === w.id}
                        className="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-red-600"
                        aria-label="Delete withdrawal"
                      >
                        {deletingId === w.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Dialog open={!!editingWithdrawal} onOpenChange={(open) => !open && setEditingWithdrawal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Edit Withdrawal {editingWithdrawal ? `— ${editingWithdrawal.staffName}` : ""}
            </DialogTitle>
          </DialogHeader>
          {editingWithdrawal && (
            <EditWithdrawalForm
              withdrawal={editingWithdrawal}
              onSuccess={() => {
                setEditingWithdrawal(null);
                router.refresh();
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
