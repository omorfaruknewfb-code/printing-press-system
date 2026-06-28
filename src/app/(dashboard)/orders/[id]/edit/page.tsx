import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { getOrderById } from "@/lib/orders-data";
import { getUsers } from "@/lib/users-data";
import { OrderForm } from "@/components/orders/order-form";

interface PageProps {
  params: { id: string };
}

export default async function EditOrderPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);
  if (session?.user.role !== "ADMIN") {
    redirect("/orders");
  }

  const order = await getOrderById(params.id);
  if (!order) notFound();

  const staffOptions = await getUsers();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Edit Order #{order.orderId}</h1>
        <p className="text-sm text-gray-500">Modify order details</p>
      </div>

      <OrderForm
        mode="edit"
        orderDbId={order.id}
        role="ADMIN"
        staffOptions={staffOptions.map(s => ({ id: s.id, name: s.name, role: s.role }))}
        orderTakenByName={order.orderTakenBy.name}
        onSuccess={() => redirect(`/orders/${order.id}`)}
        initialValues={{
          customerName: order.customer.name,
          customerMobile: order.customer.mobile,
          customerAddress: (order.customer as any).address ?? "",
          items: order.items.map(i => ({
            itemName: i.itemName,
            description: i.description ?? "",
            quantity: i.quantity,
            unitPrice: Number(i.unitPrice)
          })),
          advance: Number(order.advance),
          totalCosting: Number(order.totalCosting),
          deliveryDate: order.deliveryDate.toISOString().slice(0, 10),
          assignedToId: order.assignedToId,
        }}
      />
    </div>
  );
}
