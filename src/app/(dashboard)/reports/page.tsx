import {
  getMonthlyFinancials,
  getDailyFinancialsForCurrentMonth,
  getStaffPerformance,
  getTopItemsByQuantity,
  getTopCustomers,
  getProfitSummary,
  getCancelledOrdersSummary,
  getCancelledOrdersList,
} from "@/lib/reports-data";
import { ReportsView } from "@/components/reports/reports-view";

export default async function ReportsPage() {
  const [monthly, daily, staffPerformance, topItems, topCustomers, profitSummary, cancelledSummary, cancelledOrders] =
    await Promise.all([
      getMonthlyFinancials(6),
      getDailyFinancialsForCurrentMonth(),
      getStaffPerformance(),
      getTopItemsByQuantity(5),
      getTopCustomers(5),
      getProfitSummary(),
      getCancelledOrdersSummary(),
      getCancelledOrdersList(20),
    ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Reports</h1>
        <p className="text-sm text-gray-500">Revenue, expense, profit and staff performance</p>
      </div>

      <ReportsView
        monthly={monthly}
        daily={daily}
        staffPerformance={staffPerformance}
        topItems={topItems}
        topCustomers={topCustomers}
        profitSummary={profitSummary}
        cancelledSummary={cancelledSummary}
        cancelledOrders={cancelledOrders}
      />
    </div>
  );
}
