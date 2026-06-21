"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Wallet } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { createWithdrawal } from "@/actions/withdrawal-actions";

function formatMoney(value: number) {
  return `৳${value.toLocaleString("en-BD")}`;
}

const TYPE_LABELS: Record<"COMMISSION" | "SALARY" | "OTHER", string> = {
  COMMISSION: "Withdraw Commission",
  SALARY: "Request Salary",
  OTHER: "Withdraw Payment",
};

export function WithdrawCommissionDialog({ commissionRemaining }: { commissionRemaining: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"COMMISSION" | "SALARY" | "OTHER">("COMMISSION");
  const [amount, setAmount] = useState(commissionRemaining > 0 ? String(commissionRemaining) : "");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [remarks, setRemarks] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const result = await createWithdrawal({ type, amount: Number(amount), date, remarks });

    setIsSubmitting(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    setOpen(false);
    setRemarks("");
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Wallet className="mr-2 h-4 w-4" /> Withdraw
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{TYPE_LABELS[type]}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {type === "COMMISSION" && (
            <p className="text-sm text-gray-500">
              Commission earned this month (not yet withdrawn): {formatMoney(commissionRemaining)}
            </p>
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
            <Label htmlFor="date">Date</Label>
            <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="remarks">Remarks</Label>
            <Input id="remarks" value={remarks} onChange={(e) => setRemarks(e.target.value)} />
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Submit Withdrawal
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
