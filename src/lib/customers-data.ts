import { prisma } from "@/lib/prisma";

export async function getCustomers(search?: string) {
  return prisma.customer.findMany({
    where: search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { mobile: { contains: search } },
          ],
        }
      : undefined,
    orderBy: { name: "asc" },
    take: 200,
  });
}

export async function getCustomerProfile(customerId: string) {
  const customer = await prisma.customer.findUnique({ where: { id: customerId } });
  if (!customer) return null;

  const [orders, payments] = await Promise.all([
    prisma.order.findMany({
      where: { customerId },
      orderBy: { date: "desc" },
      select: {
        id: true,
        orderId: true,
        date: true,
        items: { select: { itemName: true, quantity: true } },
        totalBill: true,
        advance: true,
        due: true,
        status: true,
      },
    }),
    prisma.customerPayment.findMany({
      where: { customerId },
      orderBy: { paymentDate: "desc" },
    }),
  ]);

  return { customer, orders, payments };
}
