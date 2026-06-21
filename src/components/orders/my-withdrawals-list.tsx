import { Card, CardContent } from "@/components/ui/card";

interface PlainWithdrawal {
  id: string;
  type: "COMMISSION" | "SALARY" | "OTHER";
  amount: number;
  date: string;
  remarks: string;
  editedByAdmin: boolean;
}

function formatMoney(value: number) {
  return `৳${value.toLocaleString("en-BD")}`;
}

export function MyWithdrawalsList({ withdrawals }: { withdrawals: PlainWithdrawal[] }) {
  if (withdrawals.length === 0) {
    return (
      <Card>
        <CardContent className="py-6 text-center text-sm text-gray-500">
          You haven&apos;t requested any withdrawals yet.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="divide-y divide-gray-100 p-0">
        {withdrawals.map((w) => (
          <div key={w.id} className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="text-sm font-medium text-gray-900">
                {w.type} — {formatMoney(w.amount)}
              </p>
              <p className="text-xs text-gray-500">
                {w.date}
                {w.remarks ? ` · ${w.remarks}` : ""}
              </p>
            </div>
            {w.editedByAdmin && (
              <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                Edited by Admin
              </span>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
