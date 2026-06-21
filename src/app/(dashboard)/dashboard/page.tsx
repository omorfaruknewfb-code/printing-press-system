import { getServerSession } from "next-auth";
import { ClipboardList, PackageCheck, PackageSearch, Wallet, Banknote, TrendingUp, Truck } from "lucide-react";

import { authOptions } from "@/lib/auth";
import { getDashboardStats, getMonthlyChartData, getUpcomingDeliveries } from "@/lib/dashboard-data";
import { getMyCollectionSummary, getMyOrders } from "@/lib/my-collection-data";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { OrdersChart } from "@/components/dashboard/orders-chart";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { StatusBadge } from "@/components/orders/status-badge";

function formatCurrency(value: number) {
  return `৳${value.toLocaleString("en-BD")}`;
}

function formatDate(date: Date) {
  return date.toLocaleDateString("en-BD", { day: "2-digit", month: "short", year: "numeric" });
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role;

  // ── STAFF dashboard ──────────────────────────────────────────────────────────
  if (role !== "ADMIN") {
    const userId = session!.user.id;
    const [summary, myOrders] = await Promise.all([
      getMyCollectionSummary(userId),
      getMyOrders(userId),
    ]);

    const totalOrders = myOrders.length;
    const pendingOrders = myOrders.filter((o) => o.status === "PENDING").length;
    const totalDue = myOrders.reduce((sum, o) => sum + Number(o.due), 0);
    const totalBill = myOrders.reduce((sum, o) => sum + Number(o.totalBill), 0);

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Welcome, {session?.user?.name}</h1>
          <p className="text-sm text-gray-500">Your orders at a glance</p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Staff cards link to my-collection with filters */}
          <KpiCard label="My Total Orders" value={totalOrders.toLocaleString()} icon={PackageSearch} href="/my-collection" />
          <KpiCard label="My Pending Orders" value={pendingOrders.toLocaleString()} icon={ClipboardList} accent="warning" href="/my-collection?status=PENDING" />
          <KpiCard label="My Total Bill" value={formatCurrency(totalBill)} icon={PackageCheck} accent="success" href="/my-collection" />
          <KpiCard label="My Total Due" value={formatCurrency(totalDue)} icon={Wallet} accent="danger" href="/my-collection?due=1" />
          <KpiCard label="Today's Collection" value={formatCurrency(summary.todaysCollection)} icon={Banknote} accent="success" />
          <KpiCard label="Monthly Collection" value={formatCurrency(summary.monthlyCollection)} icon={TrendingUp} />
        </div>

        <p className="text-xs text-gray-400">
          Full order details, costing entry, and payment collection are available on the{" "}
          <span className="font-medium text-gray-600">My Collection</span> page.
        </p>
      </div>
    );
  }

  // ── ADMIN dashboard ───────────────────────────────────────────────────────────
  const [stats, chartData, upcomingDeliveries] = await Promise.all([
    getDashboardStats(),
    getMonthlyChartData(),
    getUpcomingDeliveries(),
  ]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todayDeliveries = upcomingDeliveries.filter(
    (o) => new Date(o.deliveryDate) >= today && new Date(o.deliveryDate) < tomorrow
  );
  const tomorrowDeliveries = upcomingDeliveries.filter(
    (o) => new Date(o.deliveryDate) >= tomorrow
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500">Overview of your printing press business</p>
      </div>

      {/* KPI cards — each links to the relevant filtered page */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <KpiCard label="Total Orders" value={stats.totalOrders.toLocaleString()} icon={PackageSearch} href="/orders" />
        <KpiCard label="Pending Orders" value={stats.pendingOrders.toLocaleString()} icon={ClipboardList} accent="warning" href="/orders?status=PENDING" />
        <KpiCard label="Delivered Orders" value={stats.deliveredOrders.toLocaleString()} icon={PackageCheck} accent="success" href="/orders?status=DELIVERED" />
        <KpiCard label="Cancelled Orders" value={stats.cancelledOrders.toLocaleString()} icon={ClipboardList} accent="danger" href="/orders?status=CANCELLED" />
        <KpiCard label="Total Due" value={formatCurrency(stats.totalDue)} icon={Wallet} accent="danger" href="/orders?due=1" />
        <KpiCard label="Today's Collection" value={formatCurrency(stats.todaysCollection)} icon={Banknote} accent="success" />
        <KpiCard label="Monthly Revenue" value={formatCurrency(stats.monthlyRevenue)} icon={TrendingUp} href="/reports" />
      </div>

      {/* Today & Tomorrow Deliveries highlight block */}
      {upcomingDeliveries.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-5">
          <div className="mb-3 flex items-center gap-2">
            <Truck className="h-5 w-5 text-amber-600" />
            <h2 className="text-sm font-semibold text-amber-800">
              আজ ও আগামীকালের ডেলিভারি ({upcomingDeliveries.length}টি)
            </h2>
          </div>

          {todayDeliveries.length > 0 && (
            <div className="mb-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-amber-700">
                আজকের ডেলিভারি — {todayDeliveries.length}টি
              </p>
              <div className="space-y-2">
                {todayDeliveries.map((order) => (
                  <DeliveryRow key={order.id} order={order} formatCurrency={formatCurrency} formatDate={formatDate} urgent />
                ))}
              </div>
            </div>
          )}

          {tomorrowDeliveries.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-amber-600">
                আগামীকালের ডেলিভারি — {tomorrowDeliveries.length}টি
              </p>
              <div className="space-y-2">
                {tomorrowDeliveries.map((order) => (
                  <DeliveryRow key={order.id} order={order} formatCurrency={formatCurrency} formatDate={formatDate} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <OrdersChart data={chartData.map((d) => ({ month: d.month, orders: d.orders }))} />
        <RevenueChart data={chartData.map((d) => ({ month: d.month, revenue: d.revenue }))} />
      </div>
    </div>
  );
}

// ── Delivery row sub-component ────────────────────────────────────────────────
type DeliveryOrder = {
  id: string;
  orderId: string;
  deliveryDate: Date;
  customer: { name: string; mobile: string };
  items: { itemName: string; quantity: number }[];
  totalBill: import("@prisma/client").Prisma.Decimal;
  due: import("@prisma/client").Prisma.Decimal;
};

function DeliveryRow({
  order,
  formatCurrency,
  formatDate,
  urgent,
}: {
  order: DeliveryOrder;
  formatCurrency: (v: number) => string;
  formatDate: (d: Date) => string;
  urgent?: boolean;
}) {
  const itemSummary = order.items.map((i) => `${i.itemName} ×${i.quantity}`).join(", ");
  const due = Number(order.due);

  return (
    <a
      href={`/orders/${order.id}/print`}
      className={`block rounded-md border px-4 py-3 text-sm transition-colors hover:bg-white ${
        urgent ? "border-red-200 bg-red-50" : "border-amber-100 bg-white"
      }`}
    >
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <span className={`font-semibold ${urgent ? "text-red-700" : "text-gray-800"}`}>
            {order.orderId}
          </span>
          <span className="text-gray-500">—</span>
          <span className="text-gray-700">{order.customer.name}</span>
          <span className="text-gray-400 text-xs">{order.customer.mobile}</span>
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-500">
          {due > 0 && (
            <span className="rounded bg-red-100 px-2 py-0.5 font-medium text-red-600">
              বাকি {formatCurrency(due)}
            </span>
          )}
          <span>{formatDate(order.deliveryDate)}</span>
        </div>
      </div>
      <p className="mt-1 truncate text-xs text-gray-500">{itemSummary}</p>
    </a>
  );
}
