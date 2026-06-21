import { prisma } from "@/lib/prisma";

function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export async function getMyOrders(userId: string) {
  return prisma.order.findMany({
    where: { orderTakenById: userId },
    include: { customer: { select: { name: true, mobile: true } }, items: true },
    orderBy: { date: "desc" },
    take: 100,
  });
}

export async function getMyCollectionSummary(userId: string) {
  const now = new Date();
  const todayStart = startOfDay(now);
  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);
  const monthStart = startOfMonth(now);

  const [todayAdvance, monthAdvance, todayPayments, monthPayments] = await Promise.all([
    prisma.order.aggregate({
      _sum: { advance: true },
      where: { orderTakenById: userId, date: { gte: todayStart, lt: tomorrowStart } },
    }),
    prisma.order.aggregate({
      _sum: { advance: true },
      where: { orderTakenById: userId, date: { gte: monthStart } },
    }),
    prisma.customerPayment.aggregate({
      _sum: { paidAmount: true },
      where: {
        paymentDate: { gte: todayStart, lt: tomorrowStart },
        order: { orderTakenById: userId },
      },
    }),
    prisma.customerPayment.aggregate({
      _sum: { paidAmount: true },
      where: {
        paymentDate: { gte: monthStart },
        order: { orderTakenById: userId },
      },
    }),
  ]);

  return {
    todaysCollection:
      Number(todayAdvance._sum.advance ?? 0) + Number(todayPayments._sum.paidAmount ?? 0),
    monthlyCollection:
      Number(monthAdvance._sum.advance ?? 0) + Number(monthPayments._sum.paidAmount ?? 0),
  };
}
