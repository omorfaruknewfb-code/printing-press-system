import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Printer, ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { getOrderById } from "@/lib/orders-data";
import { StatusBadge } from "@/components/orders/status-badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/format-date";
import { deleteOrder } from "@/actions/order-actions";

interface PageProps {
  params: { id: string };
}

function formatMoney(value: number) {
  return `৳${value.toLocaleString("en-BD")}`;
}

export default async function OrderDetailPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);
  const order = await getOrderById(params.id);
  if (!order) notFound();

  // Staff may only view orders they personally took — full Bill/Due/Costing
  // is financial data, and other staff's orders are not theirs to see
  // (mirrors the same rule already enforced in My Collection / payment
  // actions). Admin can view any order.
  if (session?.user.role !== "ADMIN" && order.orderTakenById !== session?.user.id) {
    redirect("/my-collection");
  }

  const totalBill = Number(order.totalBill);
  const advance = Number(order.advance);
  const due = Number(order.due);
  const totalCosting = Number(order.totalCosting);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/orders">
              <ArrowLeft className="mr-1 h-4 w-4" /> Back
            </Link>
          </Button>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Order #{order.orderId}</h1>
            <p className="text-sm text-gray-500">{formatDate(order.date)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={order.status} />
          {session?.user.role === "ADMIN" && (
            <>
              <Link href={`/orders/${order.id}/edit`}>
                <Button size="sm" variant="outline">
                  <Pencil className="mr-2 h-4 w-4" /> Edit
                </Button>
              </Link>
              <form action={async () => {
                "use server";
                const result = await deleteOrder(order.id);
                if (!result.success) {
                  redirect(`/orders/${order.id}?error=${encodeURIComponent(result.error)}`);
                }
                redirect("/orders");
              }}>
                <Button type="submit" size="sm" variant="destructive">
                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                </Button>
              </form>
            </>
          )}
          <Button asChild size="sm" variant="outline">
            <Link href={`/orders/${order.id}/print`} target="_blank">
              <Printer className="mr-2 h-4 w-4" /> ডেলিভারি স্লিপ
            </Link>
          </Button>
        </div>
      </div>

      {/* Customer info */}
      <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-gray-700">কাস্টমার তথ্য</h2>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-gray-500">নাম</p>
            <p className="font-medium text-gray-900">{order.customer.name}</p>
          </div>
          <div>
            <p className="text-gray-500">মোবাইল</p>
            <p className="font-medium text-gray-900">{order.customer.mobile}</p>
          </div>
        </div>
      </div>

      {/* Order items */}
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-5 py-3">
          <h2 className="text-sm font-semibold text-gray-700">আইটেম সমূহ</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-5 py-2 text-left">আইটেম</th>
              <th className="px-5 py-2 text-left">বিবরণ</th>
              <th className="px-5 py-2 text-right">পরিমাণ</th>
              <th className="px-5 py-2 text-right">একক মূল্য</th>
              <th className="px-5 py-2 text-right">মোট</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {order.items.map((item) => (
              <tr key={item.id}>
                <td className="px-5 py-3 font-medium text-gray-800">{item.itemName}</td>
                <td className="px-5 py-3 text-gray-500">{item.description ?? "—"}</td>
                <td className="px-5 py-3 text-right text-gray-700">{item.quantity}</td>
                <td className="px-5 py-3 text-right text-gray-700">{formatMoney(Number(item.unitPrice))}</td>
                <td className="px-5 py-3 text-right font-medium text-gray-900">{formatMoney(Number(item.lineTotal))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Financial summary */}
      <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-gray-700">আর্থিক সারসংক্ষেপ</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">মোট বিল</span>
            <span className="font-semibold text-gray-900">{formatMoney(totalBill)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">অগ্রিম</span>
            <span className="text-gray-700">{formatMoney(advance)}</span>
          </div>
          <div className="flex justify-between border-t border-gray-100 pt-2">
            <span className={`font-semibold ${due > 0 ? "text-red-600" : "text-emerald-600"}`}>
              {due > 0 ? "বাকি" : "পরিশোধিত"}
            </span>
            <span className={`font-bold ${due > 0 ? "text-red-600" : "text-emerald-600"}`}>
              {formatMoney(due)}
            </span>
          </div>
          {order.costingSet && (
            <div className="flex justify-between border-t border-gray-100 pt-2">
              <span className="text-gray-500">কস্টিং</span>
              <span className="text-gray-700">{formatMoney(totalCosting)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Order meta */}
      <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-gray-700">অর্ডার বিবরণ</h2>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-gray-500">ডেলিভারি তারিখ</p>
            <p className="font-medium text-gray-900">{formatDate(order.deliveryDate)}</p>
          </div>
          <div>
            <p className="text-gray-500">অর্ডার নিয়েছেন</p>
            <p className="font-medium text-gray-900">{order.orderTakenBy.name}</p>
          </div>
          {order.assignedTo && (
            <div>
              <p className="text-gray-500">অ্যাসাইন করা হয়েছে</p>
              <p className="font-medium text-gray-900">{order.assignedTo.name}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
