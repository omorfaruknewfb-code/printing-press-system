import { prisma } from "@/lib/prisma";

function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, months: number) {
  return new Date(date.getFullYear(), date.getMonth() + months, 1);
}

const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export async function getDashboardStats() {
  const now = new Date();
  const todayStart = startOfDay(now);
  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);

  const monthStart = startOfMonth(now);
  const nextMonthStart = addMonths(now, 1);

  const [
    totalOrders,
    pendingOrders,
    deliveredOrders,
    cancelledOrders,
    dueAggregate,
    todaysOrderAdvance,
    todaysPayments,
    monthlyRevenueAggregate,
  ] = await Promise.all([
    prisma.order.count(),
    prisma.order.count({ where: { status: "PENDING" } }),
    prisma.order.count({ where: { status: "DELIVERED" } }),
    prisma.order.count({ where: { status: "CANCELLED" } }),
    prisma.order.aggregate({ _sum: { due: true }, where: { status: { not: "CANCELLED" } } }),
    prisma.order.aggregate({
      _sum: { advance: true },
      where: { date: { gte: todayStart, lt: tomorrowStart }, status: { not: "CANCELLED" } },
    }),
    prisma.customerPayment.aggregate({
      _sum: { paidAmount: true },
      where: { paymentDate: { gte: todayStart, lt: tomorrowStart } },
    }),
    prisma.order.aggregate({
      _sum: { totalBill: true },
      where: { date: { gte: monthStart, lt: nextMonthStart }, status: { not: "CANCELLED" } },
    }),
  ]);

  const todaysCollection =
    Number(todaysOrderAdvance._sum.advance ?? 0) + Number(todaysPayments._sum.paidAmount ?? 0);

  return {
    totalOrders,
    pendingOrders,
    deliveredOrders,
    cancelledOrders,
    totalDue: Number(dueAggregate._sum.due ?? 0),
    todaysCollection,
    monthlyRevenue: Number(monthlyRevenueAggregate._sum.totalBill ?? 0),
  };
}

export async function getMonthlyChartData(monthsBack = 6) {
  const now = new Date();
  const rangeStart = addMonths(now, -(monthsBack - 1));

  const orders = await prisma.order.findMany({
    where: { date: { gte: rangeStart }, status: { not: "CANCELLED" } },
    select: { date: true, totalBill: true },
  });

  const buckets = new Map<string, { orders: number; revenue: number }>();

  for (let i = monthsBack - 1; i >= 0; i--) {
    const d = addMonths(now, -i);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    buckets.set(key, { orders: 0, revenue: 0 });
  }

  for (const order of orders) {
    const key = `${order.date.getFullYear()}-${order.date.getMonth()}`;
    const bucket = buckets.get(key);
    if (bucket) {
      bucket.orders += 1;
      bucket.revenue += Number(order.totalBill);
    }
  }

  return Array.from(buckets.entries()).map(([key, value]) => {
    const month = Number(key.split("-")[1]);
    return {
      month: MONTH_LABELS[month],
      orders: value.orders,
      revenue: value.revenue,
    };
  });
}

export async function getUpcomingDeliveries() {
  const now = new Date();
  // Convert to Bangladesh timezone (UTC+6)
  const bangladeshOffset = 6 * 60 * 60 * 1000; // 6 hours in milliseconds
  const localOffset = now.getTimezoneOffset() * 60 * 1000;
  const bangladeshTime = new Date(now.getTime() + localOffset + bangladeshOffset);

  const todayStart = new Date(bangladeshTime);
  todayStart.setHours(0, 0, 0, 0);

  const dayAfterTomorrow = new Date(todayStart);
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);

  return prisma.order.findMany({
    where: {
      deliveryDate: { gte: todayStart, lt: dayAfterTomorrow },
      status: { in: ["PENDING", "CONFIRMED", "READY_FOR_DELIVERY"] },
    },
    select: {
      id: true,
      orderId: true,
      deliveryDate: true,
      customer: { select: { name: true, mobile: true } },
      items: { select: { itemName: true, quantity: true } },
      totalBill: true,
      due: true,
    },
    orderBy: { deliveryDate: "asc" },
  });
}
