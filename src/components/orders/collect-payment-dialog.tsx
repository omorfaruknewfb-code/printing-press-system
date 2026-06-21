"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Banknote } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { addPayment } from "@/actions/payment-actions";

interface CollectPaymentDialogProps {
  orderDbId: string;
  customerId: string;
  orderLabel: string;
  due: number;
}

export function CollectPaymentDialog({ orderDbId, customerId, orderLabel, due }: CollectPaymentDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(due > 0 ? String(due) : "");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [remarks, setRemarks] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const result = await addPayment({
      customerId,
      orderId: orderDbId,
      paidAmount: Number(amount),
      paymentDate,
      remarks,
    });

    setIsSubmitting(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    setOpen(false);
    setRemarks("");
    router.refresh();
  }

  if (due <= 0) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Banknote className="mr-1.5 h-3.5 w-3.5" /> Collect Payment
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Collect Payment — {orderLabel}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <p className="text-sm text-gray-500">Current due: ৳{due.toLocaleString("en-BD")}</p>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount Received</Label>
            <Input
              id="amount"
              type="number"
              min={1}
              max={due}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="paymentDate">Payment Date</Label>
            <Input
              id="paymentDate"
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="remarks">Remarks</Label>
            <Input id="remarks" value={remarks} onChange={(e) => setRemarks(e.target.value)} />
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Payment
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
