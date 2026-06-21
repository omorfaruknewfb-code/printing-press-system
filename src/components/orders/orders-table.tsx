"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Pencil, Trash2, Loader2, Copy, Printer, X, Check, Truck } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { StatusBadge } from "@/components/orders/status-badge";
import { OrderForm } from "@/components/orders/order-form";
import { CollectPaymentDialog } from "@/components/orders/collect-payment-dialog";
import { DeliveryDialog } from "@/components/orders/delivery-dialog";
import { deleteOrder, duplicateOrder, cancelOrder, markWorkComplete } from "@/actions/order-actions";
import { formatDateTime } from "@/lib/format-date";

interface PlainOrderItem {
  itemName: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

interface PlainOrder {
  id: string;
  orderId: string;
  date: string;
  customerId: string;
  customerName: string;
  customerMobile: string;
  items: PlainOrderItem[];
  totalBill: number;
  advance: number;
  due: number;
  totalCosting: number;
  costingSet: boolean;
  deliveryDate: string;
  status: "PENDING" | "CONFIRMED" | "READY_FOR_DELIVERY" | "DELIVERED" | "CANCELLED";
  orderTakenByName: string;
  assignedToName: string | null;
  assignedToId: string | null;
}

interface StaffOption {
  id: string;
  name: string;
  role: string;
}

interface OrdersTableProps {
  orders: PlainOrder[];
  staffOptions: StaffOption[];
}

function formatMoney(value: number) {
  return `৳${value.toLocaleString("en-BD")}`;
}

function itemsSummary(items: PlainOrderItem[]) {
  return items.map((i) => `${i.itemName} ×${i.quantity}`).join(", ");
}

export function OrdersTable({ orders, staffOptions }: OrdersTableProps) {
  const router = useRouter();
  const [editingOrder, setEditingOrder] = useState<PlainOrder | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [completingId, setCompletingId] = useState<string | null>(null);

  async function handleDelete(order: PlainOrder) {
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

  async function handleDuplicate(order: PlainOrder) {
    setDuplicatingId(order.id);
    const result = await duplicateOrder(order.id);
    setDuplicatingId(null);

    if (!result.success) {
      alert(result.error);
      return;
    }
    router.refresh();
  }

  async function handleCancel(order: PlainOrder) {
    const confirmed = window.confirm(`Cancel order ${order.orderId}? This cannot be undone.`);
    if (!confirmed) return;

    setCancellingId(order.id);
    const result = await cancelOrder(order.id);
    setCancellingId(null);

    if (!result.success) {
      alert(result.error);
      return;
    }
    router.refresh();
  }

  async function handleWorkComplete(order: PlainOrder) {
    setCompletingId(order.id);
    const result = await markWorkComplete(order.id);
    setCompletingId(null);

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
          No orders found for the current filters.
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full min-w-[1150px] text-sm">
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
                <th className="px-4 py-3">Delivery</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Taken By</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-[#1E40AF] hover:underline">
                    <Link href={`/orders/${order.id}`}>{order.orderId}</Link>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">{formatDateTime(order.date)}</td>
                  <td className="px-4 py-3">
                    <div className="text-gray-900">{order.customerName}</div>
                    <div className="text-xs text-gray-500">{order.customerMobile}</div>
                  </td>
                  <td className="max-w-[220px] truncate px-4 py-3 text-gray-700" title={itemsSummary(order.items)}>
                    {itemsSummary(order.items)}
                  </td>
                  <td className="px-4 py-3 text-gray-700">{formatMoney(order.totalBill)}</td>
                  <td className="px-4 py-3 text-gray-700">{formatMoney(order.advance)}</td>
                  <td className="px-4 py-3 text-gray-700">{formatMoney(order.due)}</td>
                  <td className="px-4 py-3 text-gray-700">
                    {order.costingSet ? formatMoney(order.totalCosting) : (
                      <span className="text-xs text-amber-600">Not set</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-700">{order.deliveryDate}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="px-4 py-3 text-gray-700">{order.orderTakenByName}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex flex-wrap justify-end gap-2">
                      {order.due > 0 && order.status !== "CANCELLED" && (
                        <CollectPaymentDialog
                          orderDbId={order.id}
                          customerId={order.customerId}
                          orderLabel={order.orderId}
                          due={order.due}
                        />
                      )}
                      {(order.status === "PENDING" || order.status === "CONFIRMED") && (
                        <button
                          onClick={() => handleCancel(order)}
                          disabled={cancellingId === order.id}
                          className="rounded p-1.5 text-red-600 hover:bg-red-50"
                          aria-label="Cancel order"
                          title="Cancel order"
                        >
                          {cancellingId === order.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <X className="h-4 w-4" />
                          )}
                        </button>
                      )}
                      {order.status === "CONFIRMED" && (
                        <button
                          onClick={() => handleWorkComplete(order)}
                          disabled={completingId === order.id}
                          className="rounded p-1.5 text-blue-600 hover:bg-blue-50"
                          aria-label="Mark work complete"
                          title="Mark as work complete"
                        >
                          {completingId === order.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Check className="h-4 w-4" />
                          )}
                        </button>
                      )}
                      {order.status === "READY_FOR_DELIVERY" && (
                        <DeliveryDialog
                          orderDbId={order.id}
                          orderLabel={order.orderId}
                          due={order.due}
                        />
                      )}
                      <Link
                        href={`/orders/${order.id}/print`}
                        target="_blank"
                        className="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-[#1E40AF]"
                        aria-label="Print delivery slip"
                        title="Print delivery slip"
                      >
                        <Printer className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => handleDuplicate(order)}
                        disabled={duplicatingId === order.id}
                        className="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-[#1E40AF]"
                        aria-label="Duplicate order"
                        title="Duplicate as new order"
                      >
                        {duplicatingId === order.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </button>
                      <button
                        onClick={() => setEditingOrder(order)}
                        className="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-[#1E40AF]"
                        aria-label="Edit order"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(order)}
                        disabled={deletingId === order.id}
                        className="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-red-600"
                        aria-label="Delete order"
                      >
                        {deletingId === order.id ? (
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
                items: editingOrder.items,
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
