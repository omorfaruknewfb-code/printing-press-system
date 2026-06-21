"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2 } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { markWorkComplete } from "@/actions/order-actions";
import { DeliveryDialog } from "@/components/orders/delivery-dialog";

interface PendingOrder {
  id: string;
  orderId: string;
  customerName: string;
  items: { itemName: string; quantity: number }[];
  deliveryDate: string;
  status: "CONFIRMED" | "READY_FOR_DELIVERY";
  due: number;
  totalBill?: number;
  advance?: number;
  totalCosting?: number;
}

interface PendingWorksTableProps {
  orders: PendingOrder[];
  role: "ADMIN" | "STAFF";
}

function formatMoney(value: number) {
  return `৳${value.toLocaleString("en-BD")}`;
}

export function PendingWorksTable({ orders, role }: PendingWorksTableProps) {
  const router = useRouter();
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const showFinancials = role === "ADMIN";

  async function handleMarkComplete(orderId: string) {
    setUpdatingId(orderId);
    const result = await markWorkComplete(orderId);
    setUpdatingId(null);

    if (!result.success) {
      alert(result.error);
      return;
    }
    router.refresh();
  }

  if (orders.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-gray-500">
          No pending orders right now.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="overflow-x-auto p-0">
        <table className="w-full min-w-[800px] text-sm">
          <thead className="border-b border-gray-100 bg-gray-50 text-left text-xs font-medium uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Order ID</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Items</th>
              {showFinancials && (
                <>
                  <th className="px-4 py-3">Total Bill</th>
                  <th className="px-4 py-3">Advance</th>
                  <th className="px-4 py-3">Costing</th>
                </>
              )}
              <th className="px-4 py-3">Due</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Delivery</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{order.orderId}</td>
                <td className="px-4 py-3 text-gray-700">{order.customerName}</td>
                <td className="px-4 py-3 text-gray-700">
                  {order.items.map((i) => `${i.itemName} ×${i.quantity}`).join(", ")}
                </td>
                {showFinancials && (
                  <>
                    <td className="px-4 py-3 text-gray-700">{formatMoney(order.totalBill ?? 0)}</td>
                    <td className="px-4 py-3 text-gray-700">{formatMoney(order.advance ?? 0)}</td>
                    <td className="px-4 py-3 text-gray-700">{formatMoney(order.totalCosting ?? 0)}</td>
                  </>
                )}
                <td className="px-4 py-3 text-gray-700">{formatMoney(order.due)}</td>
                <td className="px-4 py-3 text-gray-700">
                  <span
                    className={`rounded px-2 py-0.5 text-xs font-medium ${
                      order.status === "READY_FOR_DELIVERY"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {order.status === "READY_FOR_DELIVERY" ? "Ready" : "In Progress"}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-700">{order.deliveryDate}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    {order.status === "CONFIRMED" && (
                      <button
                        onClick={() => handleMarkComplete(order.id)}
                        disabled={updatingId === order.id}
                        className="rounded p-1.5 text-emerald-600 hover:bg-emerald-50"
                        aria-label="Mark work complete"
                        title="Mark Work Complete"
                      >
                        {updatingId === order.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4" />
                        )}
                      </button>
                    )}
                    {order.status === "READY_FOR_DELIVERY" && (
                      <DeliveryDialog orderDbId={order.id} orderLabel={order.orderId} due={order.due} />
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
