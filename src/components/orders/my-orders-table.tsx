"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Pencil, Check, X, Printer } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/orders/status-badge";
import { CollectPaymentDialog } from "@/components/orders/collect-payment-dialog";
import { updateOrderCosting } from "@/actions/order-actions";
import { formatDateTime } from "@/lib/format-date";

interface PlainOrder {
  id: string;
  orderId: string;
  customerId: string;
  customerName: string;
  date: string;
  items: { itemName: string; quantity: number }[];
  totalBill: number;
  advance: number;
  due: number;
  totalCosting: number;
  costingSet: boolean;
  status: "PENDING" | "DELIVERED" | "REJECT";
}

function formatMoney(value: number) {
  return `৳${value.toLocaleString("en-BD")}`;
}

function CostingCell({ order }: { order: PlainOrder }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(order.totalCosting || ""));
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    const result = await updateOrderCosting({ orderDbId: order.id, totalCosting: Number(value) });
    setSaving(false);

    if (!result.success) {
      alert(result.error);
      return;
    }
    setEditing(false);
    router.refresh();
  }

  if (editing) {
    return (
      <div className="flex items-center gap-1">
        <Input
          type="number"
          min={0}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="h-8 w-24"
          autoFocus
        />
        <button onClick={handleSave} disabled={saving} className="text-emerald-600 hover:bg-emerald-50 rounded p-1">
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
        </button>
        <button onClick={() => setEditing(false)} className="text-gray-400 hover:bg-gray-100 rounded p-1">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className="flex items-center gap-1.5 text-left hover:text-[#1E40AF]"
    >
      {order.costingSet ? (
        <span className="text-gray-700">{formatMoney(order.totalCosting)}</span>
      ) : (
        <span className="text-xs text-amber-600">Add costing</span>
      )}
      <Pencil className="h-3 w-3 text-gray-300" />
    </button>
  );
}

export function MyOrdersTable({ orders }: { orders: PlainOrder[] }) {
  if (orders.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-gray-500">
          You haven&apos;t taken any orders yet.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="overflow-x-auto p-0">
        <table className="w-full min-w-[1000px] text-sm">
          <thead className="border-b border-gray-100 bg-gray-50 text-left text-xs font-medium uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Order ID</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Items</th>
              <th className="px-4 py-3">Total Bill</th>
              <th className="px-4 py-3">Advance</th>
              <th className="px-4 py-3">Due</th>
              <th className="px-4 py-3">Costing</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {orders.map((o) => (
              <tr key={o.id}>
                <td className="px-4 py-3 font-medium text-[#1E40AF] hover:underline">
                  <Link href={`/orders/${o.id}/print`} target="_blank" title="ডেলিভারি স্লিপ প্রিন্ট">
                    {o.orderId} <Printer className="inline h-3 w-3 ml-1 text-gray-400" />
                  </Link>
                </td>
                <td className="px-4 py-3 text-xs text-gray-500">{formatDateTime(o.date)}</td>
                <td className="px-4 py-3 text-gray-700">{o.customerName}</td>
                <td className="max-w-[200px] truncate px-4 py-3 text-gray-700">
                  {o.items.map((i) => `${i.itemName} ×${i.quantity}`).join(", ")}
                </td>
                <td className="px-4 py-3 text-gray-700">{formatMoney(o.totalBill)}</td>
                <td className="px-4 py-3 text-gray-700">{formatMoney(o.advance)}</td>
                <td className="px-4 py-3 text-gray-700">{formatMoney(o.due)}</td>
                <td className="px-4 py-3">
                  <CostingCell order={o} />
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={o.status} />
                </td>
                <td className="px-4 py-3 text-right">
                  {o.due > 0 && o.status !== "CANCELLED" && (
                    <CollectPaymentDialog
                      orderDbId={o.id}
                      customerId={o.customerId}
                      orderLabel={o.orderId}
                      due={o.due}
                    />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
