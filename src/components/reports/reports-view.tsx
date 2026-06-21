"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface MonthlyRow {
  month: string;
  revenue: number;
  expense: number;
  profit: number;
}

interface DailyRow {
  day: string;
  revenue: number;
  expense: number;
}

interface StaffRow {
  id: string;
  name: string;
  role: string;
  ordersTaken: number;
  deliveredOrders: number;
  collections: number;
}

interface TopItemRow {
  itemName: string;
  totalQuantity: number;
}

interface TopCustomerRow {
  id: string;
  name: string;
  mobile: string;
  totalOrders: number;
  totalBill: number;
}

interface ProfitSummary {
  revenue: number;
  costing: number;
  grossProfit: number;
  totalExpense: number;
  netProfit: number;
}

interface CancelledSummary {
  count: number;
  totalBill: number;
  totalAdvance: number;
  totalDue: number;
}

interface CancelledOrderRow {
  id: string;
  orderId: string;
  customerName: string;
  customerMobile: string;
  totalBill: number;
  advance: number;
  due: number;
  date: string;
}

function formatMoney(value: number) {
  return `৳${value.toLocaleString("en-BD")}`;
}

function KpiBox({ label, value, tone }: { label: string; value: string; tone?: "danger" | "success" }) {
  return (
    <Card>
      <CardContent className="py-4">
        <p className="text-xs text-gray-500">{label}</p>
        <p
          className={`mt-1 text-xl font-semibold ${
            tone === "danger" ? "text-red-600" : tone === "success" ? "text-emerald-600" : "text-gray-900"
          }`}
        >
          {value}
        </p>
      </CardContent>
    </Card>
  );
}

export function ReportsView({
  monthly,
  daily,
  staffPerformance,
  topItems,
  topCustomers,
  profitSummary,
  cancelledSummary,
  cancelledOrders,
}: {
  monthly: MonthlyRow[];
  daily: DailyRow[];
  staffPerformance: StaffRow[];
  topItems: TopItemRow[];
  topCustomers: { byOrderCount: TopCustomerRow[]; byTotalAmount: TopCustomerRow[] };
  profitSummary: ProfitSummary;
  cancelledSummary: CancelledSummary;
  cancelledOrders: CancelledOrderRow[];
}) {
  const currentMonth = monthly[monthly.length - 1];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiBox label="This Month's Revenue" value={formatMoney(currentMonth?.revenue ?? 0)} />
        <KpiBox label="This Month's Expense" value={formatMoney(currentMonth?.expense ?? 0)} tone="danger" />
        <KpiBox
          label="This Month's Profit"
          value={formatMoney(currentMonth?.profit ?? 0)}
          tone={(currentMonth?.profit ?? 0) >= 0 ? "success" : "danger"}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <KpiBox
          label="Gross Profit (Revenue − Costing, This Month)"
          value={formatMoney(profitSummary.grossProfit)}
          tone={profitSummary.grossProfit >= 0 ? "success" : "danger"}
        />
        <KpiBox
          label="Net Profit (Gross Profit − All Expenses, This Month)"
          value={formatMoney(profitSummary.netProfit)}
          tone={profitSummary.netProfit >= 0 ? "success" : "danger"}
        />
      </div>

      {/* Cancelled Orders — all-time, kept forever for accountability since
          cancellations can happen due to internal mistakes or a customer
          not collecting their order. */}
      <Card>
        <CardHeader>
          <p className="text-sm font-medium text-gray-700">বাতিল অর্ডার (Cancelled Orders) — সর্বমোট</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <KpiBox label="মোট বাতিল অর্ডার" value={cancelledSummary.count.toLocaleString()} tone="danger" />
            <KpiBox label="বাতিল অর্ডারের এডভান্স (জমা ছিল)" value={formatMoney(cancelledSummary.totalAdvance)} />
            <KpiBox label="বাতিল অর্ডারের বকেয়া (ডিউ ছিল)" value={formatMoney(cancelledSummary.totalDue)} tone="danger" />
          </div>

          {cancelledOrders.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead className="border-b border-gray-100 text-left text-xs font-medium uppercase text-gray-500">
                  <tr>
                    <th className="px-3 py-2">Order ID</th>
                    <th className="px-3 py-2">Customer</th>
                    <th className="px-3 py-2">Date</th>
                    <th className="px-3 py-2">Total Bill</th>
                    <th className="px-3 py-2">Advance</th>
                    <th className="px-3 py-2">Due</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {cancelledOrders.map((o) => (
                    <tr key={o.id}>
                      <td className="px-3 py-2 font-medium text-gray-900">{o.orderId}</td>
                      <td className="px-3 py-2 text-gray-700">
                        {o.customerName} <span className="text-xs text-gray-400">({o.customerMobile})</span>
                      </td>
                      <td className="px-3 py-2 text-gray-700">{o.date}</td>
                      <td className="px-3 py-2 text-gray-700">{formatMoney(o.totalBill)}</td>
                      <td className="px-3 py-2 text-gray-700">{formatMoney(o.advance)}</td>
                      <td className="px-3 py-2 text-gray-700">{formatMoney(o.due)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <p className="text-sm font-medium text-gray-700">Daily Revenue vs Expense (This Month)</p>
        </CardHeader>
        <CardContent>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={daily}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #E5E7EB", fontSize: 12 }} />
                <Legend />
                <Line type="monotone" dataKey="revenue" name="Revenue" stroke="#1E40AF" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="expense" name="Expense" stroke="#DC2626" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div>
        <h2 className="mb-3 text-sm font-medium text-gray-700">Monthly Revenue, Expense &amp; Profit</h2>
        <Card>
          <CardContent className="overflow-x-auto p-0">
            <table className="w-full min-w-[500px] text-sm">
              <thead className="border-b border-gray-100 bg-gray-50 text-left text-xs font-medium uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3">Month</th>
                  <th className="px-4 py-3">Revenue</th>
                  <th className="px-4 py-3">Expense</th>
                  <th className="px-4 py-3">Profit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {monthly.map((m) => (
                  <tr key={m.month}>
                    <td className="px-4 py-3 font-medium text-gray-900">{m.month}</td>
                    <td className="px-4 py-3 text-gray-700">{formatMoney(m.revenue)}</td>
                    <td className="px-4 py-3 text-gray-700">{formatMoney(m.expense)}</td>
                    <td className={`px-4 py-3 font-medium ${m.profit >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                      {formatMoney(m.profit)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div>
          <h2 className="mb-3 text-sm font-medium text-gray-700">Top 5 Items (by Quantity Sold)</h2>
          <Card>
            <CardContent className="p-0">
              {topItems.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-gray-500">No item sales yet.</p>
              ) : (
                <div className="divide-y divide-gray-100">
                  {topItems.map((item, idx) => (
                    <div key={item.itemName} className="flex items-center justify-between px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-50 text-xs font-semibold text-[#1E40AF]">
                          {idx + 1}
                        </span>
                        <span className="text-sm font-medium text-gray-900">{item.itemName}</span>
                      </div>
                      <span className="text-sm text-gray-700">{item.totalQuantity} pcs</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <div>
            <h2 className="mb-3 text-sm font-medium text-gray-700">Top 5 Customers (by Order Count)</h2>
            <Card>
              <CardContent className="p-0">
                {topCustomers.byOrderCount.length === 0 ? (
                  <p className="px-4 py-8 text-center text-sm text-gray-500">No customers yet.</p>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {topCustomers.byOrderCount.map((c, idx) => (
                      <div key={c.id} className="flex items-center justify-between px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-50 text-xs font-semibold text-[#1E40AF]">
                            {idx + 1}
                          </span>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{c.name}</p>
                            <p className="text-xs text-gray-500">{c.mobile}</p>
                          </div>
                        </div>
                        <span className="text-sm text-gray-700">{c.totalOrders} orders</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div>
            <h2 className="mb-3 text-sm font-medium text-gray-700">Top 5 Customers (by Total Amount)</h2>
            <Card>
              <CardContent className="p-0">
                {topCustomers.byTotalAmount.length === 0 ? (
                  <p className="px-4 py-8 text-center text-sm text-gray-500">No customers yet.</p>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {topCustomers.byTotalAmount.map((c, idx) => (
                      <div key={c.id} className="flex items-center justify-between px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-50 text-xs font-semibold text-[#1E40AF]">
                            {idx + 1}
                          </span>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{c.name}</p>
                            <p className="text-xs text-gray-500">{c.mobile}</p>
                          </div>
                        </div>
                        <span className="text-sm font-medium text-gray-900">{formatMoney(c.totalBill)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-medium text-gray-700">Staff Performance (This Month)</h2>
        <Card>
          <CardContent className="overflow-x-auto p-0">
            <table className="w-full min-w-[600px] text-sm">
              <thead className="border-b border-gray-100 bg-gray-50 text-left text-xs font-medium uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Orders Taken</th>
                  <th className="px-4 py-3">Delivered</th>
                  <th className="px-4 py-3">Collections</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {staffPerformance.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                      No active users found.
                    </td>
                  </tr>
                ) : (
                  staffPerformance.map((s) => (
                    <tr key={s.id}>
                      <td className="px-4 py-3 font-medium text-gray-900">{s.name}</td>
                      <td className="px-4 py-3 text-gray-700">{s.role}</td>
                      <td className="px-4 py-3 text-gray-700">{s.ordersTaken}</td>
                      <td className="px-4 py-3 text-gray-700">{s.deliveredOrders}</td>
                      <td className="px-4 py-3 text-gray-700">{formatMoney(s.collections)}</td>
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
