import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getActiveUsers } from "@/lib/orders-data";
import { OrderForm } from "@/components/orders/order-form";

export default async function NewOrderPage() {
  const session = await getServerSession(authOptions);
  const role = session!.user.role;

  const staffOptions = role === "ADMIN" ? await getActiveUsers() : [];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">New Order</h1>
        <p className="text-sm text-gray-500">Create a new printing order</p>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <OrderForm
          mode="create"
          role={role}
          staffOptions={staffOptions}
          orderTakenByName={session?.user?.name ?? undefined}
        />
      </div>
    </div>
  );
}
