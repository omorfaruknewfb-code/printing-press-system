"use client";

import { Printer } from "lucide-react";

interface OrderItem {
  itemName: string;
  description: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

interface PlainOrder {
  id: string;
  orderId: string;
  date: string;
  deliveryDate: string;
  status: string;
  customerName: string;
  customerMobile: string;
  orderTakenByName: string;
  assignedToName: string | null;
  items: OrderItem[];
  totalBill: number;
  advance: number;
  due: number;
}

interface PrintSlipClientProps {
  order: PlainOrder;
  orgName: string;
  logoUrl: string | null;
}

function formatMoney(value: number) {
  return `৳${value.toLocaleString("en-BD")}`;
}

function formatDateBD(isoDate: string) {
  return new Date(isoDate).toLocaleDateString("en-BD", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function PrintSlipClient({ order, orgName, logoUrl }: PrintSlipClientProps) {
  return (
    <>
      {/* Print button — hidden during actual print */}
      <div className="mb-6 flex items-center justify-between print:hidden">
        <h1 className="text-xl font-semibold text-gray-900">ডেলিভারি চালান</h1>
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 rounded-md bg-[#1E40AF] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
        >
          <Printer className="h-4 w-4" />
          প্রিন্ট করুন
        </button>
      </div>

      {/* Slip — styled for print */}
      <div
        id="print-slip"
        className="mx-auto max-w-[720px] rounded-lg border border-gray-300 bg-white p-8 shadow-sm print:border-0 print:shadow-none print:p-6"
      >
        {/* Organisation header */}
        <div className="mb-6 flex items-center justify-between border-b border-gray-300 pb-5">
          <div className="flex items-center gap-3">
            {logoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt={orgName} className="h-12 w-12 rounded-full object-cover" />
            )}
            <div>
              <p className="text-xl font-bold text-[#1E40AF]">{orgName}</p>
              <p className="text-xs text-gray-500">ডেলিভারি চালান / Delivery Challan</p>
            </div>
          </div>
          <div className="text-right text-sm text-gray-600">
            <p>
              <span className="font-semibold">চালান নং:</span> {order.orderId}
            </p>
            <p>
              <span className="font-semibold">তারিখ:</span> {formatDateBD(order.date)}
            </p>
            <p>
              <span className="font-semibold">ডেলিভারি:</span>{" "}
              <span className="font-bold text-red-600">{formatDateBD(order.deliveryDate)}</span>
            </p>
          </div>
        </div>

        {/* Customer info */}
        <div className="mb-6 grid grid-cols-2 gap-4 rounded-md border border-gray-200 bg-gray-50 p-4 text-sm">
          <div>
            <p className="text-xs font-semibold uppercase text-gray-500">কাস্টমার</p>
            <p className="font-semibold text-gray-900">{order.customerName}</p>
            <p className="text-gray-600">{order.customerMobile}</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold uppercase text-gray-500">অর্ডার নিয়েছেন</p>
            <p className="font-semibold text-gray-900">{order.orderTakenByName}</p>
            {order.assignedToName && (
              <p className="text-xs text-gray-500">অ্যাসাইন: {order.assignedToName}</p>
            )}
          </div>
        </div>

        {/* Items table */}
        <table className="mb-6 w-full text-sm">
          <thead>
            <tr className="bg-[#1E40AF] text-white">
              <th className="px-3 py-2 text-left font-medium">আইটেম</th>
              <th className="px-3 py-2 text-left font-medium">বিবরণ</th>
              <th className="px-3 py-2 text-center font-medium">পরিমাণ</th>
              <th className="px-3 py-2 text-right font-medium">একক মূল্য</th>
              <th className="px-3 py-2 text-right font-medium">মোট</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item, idx) => (
              <tr
                key={idx}
                className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}
              >
                <td className="border-b border-gray-200 px-3 py-2 font-medium text-gray-800">
                  {item.itemName}
                </td>
                <td className="border-b border-gray-200 px-3 py-2 text-gray-500">
                  {item.description || "—"}
                </td>
                <td className="border-b border-gray-200 px-3 py-2 text-center text-gray-700">
                  {item.quantity}
                </td>
                <td className="border-b border-gray-200 px-3 py-2 text-right text-gray-700">
                  {formatMoney(item.unitPrice)}
                </td>
                <td className="border-b border-gray-200 px-3 py-2 text-right font-semibold text-gray-900">
                  {formatMoney(item.lineTotal)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Financial summary */}
        <div className="ml-auto max-w-xs space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">মোট বিল</span>
            <span className="font-semibold text-gray-900">{formatMoney(order.totalBill)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">অগ্রিম প্রদত্ত</span>
            <span className="text-gray-700">{formatMoney(order.advance)}</span>
          </div>
          <div className="flex justify-between border-t-2 border-gray-300 pt-2">
            <span className={`font-bold ${order.due > 0 ? "text-red-600" : "text-emerald-600"}`}>
              {order.due > 0 ? "বাকি পরিমাণ" : "সম্পূর্ণ পরিশোধিত"}
            </span>
            <span className={`text-lg font-extrabold ${order.due > 0 ? "text-red-600" : "text-emerald-600"}`}>
              {formatMoney(order.due)}
            </span>
          </div>
        </div>

        {/* Signature line */}
        <div className="mt-10 grid grid-cols-2 gap-8 border-t border-gray-300 pt-6 text-sm text-gray-500">
          <div>
            <div className="mb-6 border-b border-dashed border-gray-400" />
            <p className="text-center">কাস্টমারের স্বাক্ষর</p>
          </div>
          <div>
            <div className="mb-6 border-b border-dashed border-gray-400" />
            <p className="text-center">কর্তৃপক্ষের স্বাক্ষর</p>
          </div>
        </div>

        {/* Footer note */}
        <p className="mt-4 text-center text-xs text-gray-400 print:block">
          এই চালানটি কম্পিউটার জেনারেটেড — কোনো সিলমোহরের প্রয়োজন নেই।
        </p>
      </div>

      {/* Print-only styles injected via style tag */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #print-slip, #print-slip * { visibility: visible; }
          #print-slip { position: absolute; inset: 0; }
        }
      `}</style>
    </>
  );
}
