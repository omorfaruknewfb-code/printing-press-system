import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPendingOrders } from "@/lib/orders-data";
import { PendingWorksTable } from "@/components/orders/pending-works-table";

export default async function PendingWorksPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/login");
  }
  const role = session.user.role;

  // All Pending orders are visible to every Staff member (not just the
  // person who took the order) — anyone may hand over finished work.
  const orders = await getPendingOrders();

  const plainOrders = orders.map((o) => {
    const base = {
      id: o.id,
      orderId: o.orderId,
      customerName: o.customer.name,
      items: o.items.map((i) => ({ itemName: i.itemName, quantity: i.quantity })),
      deliveryDate: o.deliveryDate.toISOString().slice(0, 10),
      status: o.status as "CONFIRMED" | "READY_FOR_DELIVERY",
      // Due is needed by every role to actually collect payment on
      // delivery, so it's always included even though Staff doesn't see
      // the other money fields (Total Bill / Advance / Costing).
      due: Number(o.due),
    };

    // Staff never receives these fields at all — not just hidden in the UI,
    // they are absent from the data sent to the browser (Security Rule 3).
    if (role !== "ADMIN") return base;

    return {
      ...base,
      totalBill: Number(o.totalBill),
      advance: Number(o.advance),
      totalCosting: Number(o.totalCosting),
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Pending Works</h1>
        <p className="text-sm text-gray-500">{plainOrders.length} order(s) awaiting completion</p>
      </div>

      <PendingWorksTable orders={plainOrders} role={role} />
    </div>
  );
}
