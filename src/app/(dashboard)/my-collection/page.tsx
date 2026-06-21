import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getMyOrders, getMyCollectionSummary } from "@/lib/my-collection-data";
import { getStaffMonthlyCommission, getMyWithdrawals } from "@/lib/commission-data";
import { Card, CardContent } from "@/components/ui/card";
import { MyOrdersTable } from "@/components/orders/my-orders-table";
import { WithdrawCommissionDialog } from "@/components/orders/withdraw-commission-dialog";
import { MyWithdrawalsList } from "@/components/orders/my-withdrawals-list";

function formatMoney(value: number) {
  return `৳${value.toLocaleString("en-BD")}`;
}

export default async function MyCollectionPage() {
  const session = await getServerSession(authOptions);

  // Second, independent check (Rule 7) — middleware already blocks Admin here.
  if (session?.user?.role !== "STAFF") {
    redirect("/dashboard");
  }

  const userId = session.user.id;
  const [orders, summary, commission, myWithdrawals] = await Promise.all([
    getMyOrders(userId),
    getMyCollectionSummary(userId),
    getStaffMonthlyCommission(userId),
    getMyWithdrawals(userId),
  ]);

  const plainOrders = orders.map((o) => ({
    id: o.id,
    orderId: o.orderId,
    customerId: o.customerId,
    customerName: o.customer.name,
    date: o.date.toISOString(),
    items: o.items.map((i) => ({ itemName: i.itemName, quantity: i.quantity })),
    totalBill: Number(o.totalBill),
    advance: Number(o.advance),
    due: Number(o.due),
    totalCosting: Number(o.totalCosting),
    costingSet: o.costingSet,
    status: o.status,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">My Collection</h1>
          <p className="text-sm text-gray-500">
            Orders you&apos;ve taken — view full details, add costing, and collect payment
          </p>
        </div>
        <WithdrawCommissionDialog commissionRemaining={commission.commissionRemaining} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="py-4">
            <p className="text-xs text-gray-500">Today&apos;s Collection</p>
            <p className="mt-1 text-xl font-semibold text-gray-900">
              {formatMoney(summary.todaysCollection)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-xs text-gray-500">Monthly Collection</p>
            <p className="mt-1 text-xl font-semibold text-gray-900">
              {formatMoney(summary.monthlyCollection)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-xs text-gray-500">This Month&apos;s Commission ({commission.commissionRate}%)</p>
            <p className="mt-1 text-xl font-semibold text-gray-900">
              {formatMoney(commission.commissionEarned)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-xs text-gray-500">Remaining (Not Withdrawn)</p>
            <p className="mt-1 text-xl font-semibold text-gray-900">
              {formatMoney(commission.commissionRemaining)}
            </p>
          </CardContent>
        </Card>
      </div>

      <MyOrdersTable orders={plainOrders} />

      <div>
        <h2 className="mb-3 text-sm font-semibold text-gray-900">My Withdrawal History</h2>
        <MyWithdrawalsList withdrawals={myWithdrawals} />
      </div>
    </div>
  );
}
