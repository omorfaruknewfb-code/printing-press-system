import { notFound } from "next/navigation";
import { getCustomerProfile } from "@/lib/customers-data";
import { CustomerDetailView } from "@/components/customers/customer-detail-view";

export default async function CustomerDetailPage({ params }: { params: { id: string } }) {
  const profile = await getCustomerProfile(params.id);
  if (!profile) notFound();

  const { customer, orders, payments } = profile;

  return (
    <CustomerDetailView
      customer={{
        id: customer.id,
        name: customer.name,
        mobile: customer.mobile,
        address: customer.address ?? "",
        totalOrders: customer.totalOrders,
        totalBill: Number(customer.totalBill),
        totalPaid: Number(customer.totalPaid),
        totalDue: Number(customer.totalDue),
      }}
      orders={orders.map((o) => ({
        id: o.id,
        orderId: o.orderId,
        date: o.date.toISOString().slice(0, 10),
        items: o.items.map((i) => ({ itemName: i.itemName, quantity: i.quantity })),
        totalBill: Number(o.totalBill),
        advance: Number(o.advance),
        due: Number(o.due),
        status: o.status,
      }))}
      payments={payments.map((p) => ({
        id: p.id,
        paymentDate: p.paymentDate.toISOString().slice(0, 10),
        billAmount: Number(p.billAmount),
        paidAmount: Number(p.paidAmount),
        dueAmount: Number(p.dueAmount),
        remarks: p.remarks ?? "",
      }))}
      openDueOrders={orders
        .filter((o) => Number(o.due) > 0 && o.status !== "CANCELLED")
        .map((o) => ({ id: o.id, orderId: o.orderId, due: Number(o.due) }))}
    />
  );
}
