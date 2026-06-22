"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2 } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { StatusBadge } from "@/components/orders/status-badge";
import { addPayment } from "@/actions/payment-actions";

interface Customer {
  id: string;
  name: string;
  mobile: string;
  address: string;
  totalOrders: number;
  totalBill: number;
  totalPaid: number;
  totalDue: number;
}

interface OrderRow {
  id: string;
  orderId: string;
  date: string;
  items: { itemName: string; quantity: number }[];
  totalBill: number;
  advance: number;
  due: number;
  status: "PENDING" | "CONFIRMED" | "READY_FOR_DELIVERY" | "DELIVERED" | "CANCELLED";
}

interface PaymentRow {
  id: string;
  paymentDate: string;
  billAmount: number;
  paidAmount: number;
  dueAmount: number;
  remarks: string;
}

interface OpenDueOrder {
  id: string;
  orderId: string;
  due: number;
}

function formatMoney(value: number) {
  return `৳${value.toLocaleString("en-BD")}`;
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="py-4">
        <p className="text-xs text-gray-500">{label}</p>
        <p className="mt-1 text-lg font-semibold text-gray-900">{value}</p>
      </CardContent>
    </Card>
  );
}

export function CustomerDetailView({
  customer,
  orders,
  payments,
  openDueOrders,
}: {
  customer: Customer;
  orders: OrderRow[];
  payments: PaymentRow[];
  openDueOrders: OpenDueOrder[];
}) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [orderId, setOrderId] = useState("");
  const [paidAmount, setPaidAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [remarks, setRemarks] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const result = await addPayment({
      customerId: customer.id,
      orderId: orderId || null,
      paidAmount: Number(paidAmount),
      paymentDate,
      remarks,
    });

    setIsSubmitting(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    setDialogOpen(false);
    setPaidAmount("");
    setRemarks("");
    setOrderId("");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="text-lg font-semibold text-gray-900">{customer.name}</h1>
        <p className="text-sm text-gray-500">{customer.mobile}</p>
        {customer.address && <p className="text-sm text-gray-500">{customer.address}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <SummaryCard label="Total Orders" value={customer.totalOrders.toString()} />
        <SummaryCard label="Total Bill" value={formatMoney(customer.totalBill)} />
        <SummaryCard label="Total Paid" value={formatMoney(customer.totalPaid)} />
        <SummaryCard label="Total Due" value={formatMoney(customer.totalDue)} />
      </div>

      <div>
        <h2 className="mb-3 text-sm font-medium text-gray-700">Order History</h2>
        <Card>
          <CardContent className="overflow-x-auto p-0">
            <table className="w-full min-w-[700px] text-sm">
              <thead className="border-b border-gray-100 bg-gray-50 text-left text-xs font-medium uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3">Order ID</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Items</th>
                  <th className="px-4 py-3">Total Bill</th>
                  <th className="px-4 py-3">Advance</th>
                  <th className="px-4 py-3">Due</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                      No orders yet.
                    </td>
                  </tr>
                ) : (
                  orders.map((o) => (
                    <tr key={o.id}>
                      <td className="px-4 py-3 font-medium text-gray-900">{o.orderId}</td>
                      <td className="px-4 py-3 text-gray-700">{o.date}</td>
                      <td className="px-4 py-3 text-gray-700">
                        {o.items.map((i) => `${i.itemName} ×${i.quantity}`).join(", ")}
                      </td>
                      <td className="px-4 py-3 text-gray-700">{formatMoney(o.totalBill)}</td>
                      <td className="px-4 py-3 text-gray-700">{formatMoney(o.advance)}</td>
                      <td className="px-4 py-3 text-gray-700">{formatMoney(o.due)}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={o.status} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-medium text-gray-700">Payment Ledger</h2>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" /> Add Payment
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Record a Payment</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="orderId">Against Order (optional)</Label>
                  <Select id="orderId" value={orderId} onChange={(e) => setOrderId(e.target.value)}>
                    <option value="">General payment (not tied to a specific order)</option>
                    {openDueOrders.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.orderId} — due {formatMoney(o.due)}
                      </option>
                    ))}
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="paidAmount">Amount Received</Label>
                  <Input
                    id="paidAmount"
                    type="number"
                    min={1}
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(e.target.value)}
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
        </div>

        <Card>
          <CardContent className="overflow-x-auto p-0">
            <table className="w-full min-w-[600px] text-sm">
              <thead className="border-b border-gray-100 bg-gray-50 text-left text-xs font-medium uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Bill Amount</th>
                  <th className="px-4 py-3">Paid Amount</th>
                  <th className="px-4 py-3">Due Amount</th>
                  <th className="px-4 py-3">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                      No payments recorded yet.
                    </td>
                  </tr>
                ) : (
                  payments.map((p) => (
                    <tr key={p.id}>
                      <td className="px-4 py-3 text-gray-700">{p.paymentDate}</td>
                      <td className="px-4 py-3 text-gray-700">{formatMoney(p.billAmount)}</td>
                      <td className="px-4 py-3 text-gray-700">{formatMoney(p.paidAmount)}</td>
                      <td className="px-4 py-3 text-gray-700">{formatMoney(p.dueAmount)}</td>
                      <td className="px-4 py-3 text-gray-700">{p.remarks || "—"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
