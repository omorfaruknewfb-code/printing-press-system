"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Loader2, Pencil, Trash2 } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { markWorkComplete, deleteOrder } from "@/actions/order-actions";
import { DeliveryDialog } from "@/components/orders/delivery-dialog";
import { OrderForm } from "@/components/orders/order-form";

interface PendingOrder {
  id: string;
  orderId: string;
  customerName: string;
  customerMobile: string;
  items: { itemName: string; quantity: number; description: string; unitPrice: number }[];
  deliveryDate: string;
  status: "CONFIRMED" | "READY_FOR_DELIVERY";
  due: number;
  totalBill?: number;
  advance?: number;
  totalCosting?: number;
  orderTakenByName?: string;
  assignedToId?: string | null;
}

interface StaffOption {
  id: string;
  name: string;
  role: string;
}

interface PendingWorksTableProps {
  orders: PendingOrder[];
  role: "ADMIN" | "STAFF";
  staffOptions?: StaffOption[];
}

function formatMoney(value: number) {
  return `৳${value.toLocaleString("en-BD")}`;
}

export function PendingWorksTable({ orders, role, staffOptions = [] }: PendingWorksTableProps) {
  const router = useRouter();
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingOrder, setEditingOrder] = useState<PendingOrder | null>(null);
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

  async function handleDelete(order: PendingOrder) {
    const confirmed = window.confirm(`Delete order ${order.orderId}? This cannot be undone.`);
    if (!confirmed) return;

    setDeletingId(order.id);
    const result = await deleteOrder(order.id);
    setDeletingId(null);

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
    <>
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
                  <td className="px-4 py-3 font-medium text-[#1E40AF] hover:underline">
                    <Link href={`/orders/${order.id}`}>{order.orderId}</Link>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-gray-900">{order.customerName}</div>
                    <div className="text-xs text-gray-500">{order.customerMobile}</div>
                  </td>
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
                    <div className="flex flex-wrap justify-end gap-2">
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
                      {role === "ADMIN" && (
                        <>
                          <button
                            onClick={() => setEditingOrder(order)}
                            className="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-[#1E40AF]"
                            aria-label="Edit order"
                            title="Edit order"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(order)}
                            disabled={deletingId === order.id}
                            className="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-red-600"
                            aria-label="Delete order"
                            title="Delete order"
                          >
                            {deletingId === order.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Dialog open={!!editingOrder} onOpenChange={(open) => !open && setEditingOrder(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Order {editingOrder?.orderId}</DialogTitle>
          </DialogHeader>
          {editingOrder && (
            <OrderForm
              mode="edit"
              orderDbId={editingOrder.id}
              role="ADMIN"
              staffOptions={staffOptions}
              orderTakenByName={editingOrder.orderTakenByName}
              onSuccess={() => setEditingOrder(null)}
              initialValues={{
                customerName: editingOrder.customerName,
                customerMobile: editingOrder.customerMobile,
                items: editingOrder.items.map(i => ({
                  itemName: i.itemName,
                  description: i.description,
                  quantity: i.quantity,
                  unitPrice: i.unitPrice
                })),
                advance: editingOrder.advance,
                totalCosting: editingOrder.totalCosting,
                deliveryDate: editingOrder.deliveryDate,
                assignedToId: editingOrder.assignedToId,
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
