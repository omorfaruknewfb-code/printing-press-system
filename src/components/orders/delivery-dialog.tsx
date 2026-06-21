"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Truck, DollarSign, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { deliverOrder } from "@/actions/order-actions";

interface DeliveryDialogProps {
  orderDbId: string;
  orderLabel: string;
  due: number;
}

export function DeliveryDialog({ orderDbId, orderLabel, due }: DeliveryDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(due > 0 ? String(due) : "0");
  const [remarks, setRemarks] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const result = await deliverOrder(
      orderDbId,
      Number(paymentAmount),
      remarks || undefined
    );

    setIsSubmitting(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    setOpen(false);
    setRemarks("");
    router.refresh();
  }

  function handleFullPayment() {
    setPaymentAmount(String(due));
  }

  function handlePartialPayment() {
    setPaymentAmount("0");
  }

  function handleNoPayment() {
    setPaymentAmount("0");
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Truck className="mr-1.5 h-3.5 w-3.5" /> Deliver
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Deliver Order — {orderLabel}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-sm font-medium text-gray-700">Due Amount</p>
            <p className="text-2xl font-bold text-gray-900">৳{due.toLocaleString("en-BD")}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="paymentAmount">Payment Amount</Label>
            <Input
              id="paymentAmount"
              type="number"
              min={0}
              max={due}
              step="0.01"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              onFocus={(e) => e.target.select()}
              required
            />
            <div className="flex gap-2 mt-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleFullPayment}
                className="flex-1"
              >
                <DollarSign className="mr-1 h-3 w-3" /> Full
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handlePartialPayment}
                className="flex-1"
              >
                <DollarSign className="mr-1 h-3 w-3" /> Partial
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleNoPayment}
                className="flex-1"
              >
                <X className="mr-1 h-3 w-3" /> None
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="remarks">Remarks (Optional)</Label>
            <Input
              id="remarks"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Add any notes about this delivery"
            />
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Complete Delivery
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
