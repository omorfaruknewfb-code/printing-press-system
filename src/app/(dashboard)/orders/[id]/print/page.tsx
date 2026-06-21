import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { getOrderById } from "@/lib/orders-data";
import { getSettings } from "@/lib/settings-data";
import { PrintSlipClient } from "@/components/orders/print-slip-client";

interface PageProps {
  params: { id: string };
}

export default async function PrintSlipPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);
  const [order, settings] = await Promise.all([
    getOrderById(params.id),
    getSettings(),
  ]);

  if (!order) notFound();

  if (session?.user.role !== "ADMIN" && order.orderTakenById !== session?.user.id) {
    redirect("/my-collection");
  }

  const plainOrder = {
    id: order.id,
    orderId: order.orderId,
    date: order.date.toISOString(),
    deliveryDate: order.deliveryDate.toISOString(),
    status: order.status,
    customerName: order.customer.name,
    customerMobile: order.customer.mobile,
    orderTakenByName: order.orderTakenBy.name,
    assignedToName: order.assignedTo?.name ?? null,
    items: order.items.map((i) => ({
      itemName: i.itemName,
      description: i.description ?? "",
      quantity: i.quantity,
      unitPrice: Number(i.unitPrice),
      lineTotal: Number(i.lineTotal),
    })),
    totalBill: Number(order.totalBill),
    advance: Number(order.advance),
    due: Number(order.due),
  };

  return (
    <PrintSlipClient
      order={plainOrder}
      orgName={settings.orgName}
      logoUrl={settings.logoUrl ?? null}
    />
  );
}
