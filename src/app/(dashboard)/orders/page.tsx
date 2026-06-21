import { getOrders, getActiveUsers } from "@/lib/orders-data";
import { OrdersFilters } from "@/components/orders/orders-filters";
import { OrdersTable } from "@/components/orders/orders-table";
import { OrderStatus } from "@prisma/client";

interface PageProps {
  searchParams: {
    search?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
    due?: string; // "1" = only show orders with due > 0
  };
}

export default async function OrdersPage({ searchParams }: PageProps) {
  const status = (searchParams.status as OrderStatus | "ALL" | undefined) ?? "ALL";

  const [orders, staffOptions] = await Promise.all([
    getOrders({
      search: searchParams.search,
      status,
      dateFrom: searchParams.dateFrom,
      dateTo: searchParams.dateTo,
    }),
    getActiveUsers(),
  ]);

  // Client-side due filter (applied after fetch — avoids schema changes)
  const filtered =
    searchParams.due === "1" ? orders.filter((o) => Number(o.due) > 0) : orders;

  const plainOrders = filtered.map((o) => ({
    id: o.id,
    orderId: o.orderId,
    date: o.date.toISOString(),
    customerId: o.customerId,
    customerName: o.customer.name,
    customerMobile: o.customer.mobile,
    items: o.items.map((i) => ({
      itemName: i.itemName,
      description: i.description ?? "",
      quantity: i.quantity,
      unitPrice: Number(i.unitPrice),
    })),
    totalBill: Number(o.totalBill),
    advance: Number(o.advance),
    due: Number(o.due),
    totalCosting: Number(o.totalCosting),
    costingSet: o.costingSet,
    deliveryDate: o.deliveryDate.toISOString().slice(0, 10),
    status: o.status,
    orderTakenByName: o.orderTakenBy.name,
    assignedToName: o.assignedTo?.name ?? null,
    assignedToId: o.assignedToId,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Orders</h1>
          <p className="text-sm text-gray-500">
            {plainOrders.length} order(s) found
            {searchParams.due === "1" && (
              <span className="ml-2 rounded bg-red-100 px-2 py-0.5 text-xs font-medium text-red-600">
                শুধু বাকি অর্ডার
              </span>
            )}
          </p>
        </div>
      </div>

      <OrdersFilters />

      <OrdersTable orders={plainOrders} staffOptions={staffOptions} />
    </div>
  );
}
