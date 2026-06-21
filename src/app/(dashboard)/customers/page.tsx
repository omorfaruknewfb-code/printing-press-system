import { getCustomers } from "@/lib/customers-data";
import { CustomersTable } from "@/components/customers/customers-table";

interface PageProps {
  searchParams: { search?: string };
}

export default async function CustomersPage({ searchParams }: PageProps) {
  const customers = await getCustomers(searchParams.search);

  const plainCustomers = customers.map((c) => ({
    id: c.id,
    name: c.name,
    mobile: c.mobile,
    address: c.address ?? "",
    totalOrders: c.totalOrders,
    totalBill: Number(c.totalBill),
    totalPaid: Number(c.totalPaid),
    totalDue: Number(c.totalDue),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Customers</h1>
        <p className="text-sm text-gray-500">{plainCustomers.length} customer(s)</p>
      </div>

      <CustomersTable customers={plainCustomers} />
    </div>
  );
}
