import { getAllWithdrawals } from "@/lib/commission-data";
import { WithdrawalsTable } from "@/components/users/withdrawals-table";

export default async function WithdrawalsPage() {
  const withdrawals = await getAllWithdrawals();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Staff Withdrawal History</h1>
        <p className="text-sm text-gray-500">
          All commission, salary, and other withdrawals recorded by staff. Each entry is also reflected
          as a &quot;Staff Payment&quot; expense.
        </p>
      </div>

      <WithdrawalsTable withdrawals={withdrawals} />
    </div>
  );
}
