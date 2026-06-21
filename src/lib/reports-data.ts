import { prisma } from "@/lib/prisma";

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, months: number) {
  return new Date(date.getFullYear(), date.getMonth() + months, 1);
}

function daysInMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export async function getMonthlyFinancials(monthsBack = 6) {
  const now = new Date();
  const rangeStart = addMonths(now, -(monthsBack - 1));

  const [orders, expenses] = await Promise.all([
    prisma.order.findMany({
      where: { date: { gte: rangeStart }, status: { not: "CANCELLED" } },
      select: { date: true, totalBill: true },
    }),
    prisma.expense.findMany({
      where: { date: { gte: rangeStart } },
      select: { date: true, amount: true },
    }),
  ]);

  const buckets = new Map<string, { revenue: number; expense: number }>();
  for (let i = monthsBack - 1; i >= 0; i--) {
    const d = addMonths(now, -i);
    buckets.set(`${d.getFullYear()}-${d.getMonth()}`, { revenue: 0, expense: 0 });
  }

  for (const o of orders) {
    const key = `${o.date.getFullYear()}-${o.date.getMonth()}`;
    const bucket = buckets.get(key);
    if (bucket) bucket.revenue += Number(o.totalBill);
  }

  for (const e of expenses) {
    const key = `${e.date.getFullYear()}-${e.date.getMonth()}`;
    const bucket = buckets.get(key);
    if (bucket) bucket.expense += Number(e.amount);
  }

  return Array.from(buckets.entries()).map(([key, value]) => {
    const month = Number(key.split("-")[1]);
    return {
      month: MONTH_LABELS[month],
      revenue: value.revenue,
      expense: value.expense,
      profit: value.revenue - value.expense,
    };
  });
}

export async function getDailyFinancialsForCurrentMonth() {
  const now = new Date();
  const start = startOfMonth(now);
  const end = addMonths(now, 1);
  const totalDays = daysInMonth(now);

  const [orders, expenses] = await Promise.all([
    prisma.order.findMany({
      where: { date: { gte: start, lt: end }, status: { not: "CANCELLED" } },
      select: { date: true, totalBill: true },
    }),
    prisma.expense.findMany({
      where: { date: { gte: start, lt: end } },
      select: { date: true, amount: true },
    }),
  ]);

  const days = Array.from({ length: totalDays }, (_, i) => ({
    day: String(i + 1),
    revenue: 0,
    expense: 0,
  }));

  for (const o of orders) {
    const idx = o.date.getDate() - 1;
    if (days[idx]) days[idx].revenue += Number(o.totalBill);
  }
  for (const e of expenses) {
    const idx = e.date.getDate() - 1;
    if (days[idx]) days[idx].expense += Number(e.amount);
  }

  return days;
}

/** Top 5 items by total quantity sold, across all orders (all-time). */
export async function getTopItemsByQuantity(limit = 5) {
  const rows = await prisma.orderItem.groupBy({
    by: ["itemName"],
    _sum: { quantity: true },
    orderBy: { _sum: { quantity: "desc" } },
    take: limit,
  });

  return rows.map((r) => ({
    itemName: r.itemName,
    totalQuantity: r._sum.quantity ?? 0,
  }));
}

/** Top 5 customers by number of orders placed, and separately by total amount billed. */
export async function getTopCustomers(limit = 5) {
  const [byOrderCount, byTotalAmount] = await Promise.all([
    prisma.customer.findMany({
      orderBy: { totalOrders: "desc" },
      take: limit,
      select: { id: true, name: true, mobile: true, totalOrders: true, totalBill: true },
    }),
    prisma.customer.findMany({
      orderBy: { totalBill: "desc" },
      take: limit,
      select: { id: true, name: true, mobile: true, totalOrders: true, totalBill: true },
    }),
  ]);

  return {
    byOrderCount: byOrderCount.map((c) => ({
      id: c.id,
      name: c.name,
      mobile: c.mobile,
      totalOrders: c.totalOrders,
      totalBill: Number(c.totalBill),
    })),
    byTotalAmount: byTotalAmount.map((c) => ({
      id: c.id,
      name: c.name,
      mobile: c.mobile,
      totalOrders: c.totalOrders,
      totalBill: Number(c.totalBill),
    })),
  };
}

/**
 * Gross Profit = Revenue (totalBill of orders with costing set) - Costing.
 * Net Profit = Gross Profit - all Expenses (this naturally includes Staff
 * Payment withdrawals, since those are mirrored into the Expense table).
 * Scoped to the current calendar month, matching the rest of the Reports page.
 */
export async function getProfitSummary() {
  const now = new Date();
  const start = startOfMonth(now);
  const end = addMonths(now, 1);

  const [costedOrders, expenseAgg] = await Promise.all([
    prisma.order.findMany({
      where: { date: { gte: start, lt: end }, costingSet: true },
      select: { totalBill: true, totalCosting: true },
    }),
    prisma.expense.aggregate({
      _sum: { amount: true },
      where: { date: { gte: start, lt: end } },
    }),
  ]);

  const revenue = costedOrders.reduce((sum, o) => sum + Number(o.totalBill), 0);
  const costing = costedOrders.reduce((sum, o) => sum + Number(o.totalCosting), 0);
  const grossProfit = revenue - costing;
  const totalExpense = Number(expenseAgg._sum.amount ?? 0);
  const netProfit = grossProfit - totalExpense;

  return { revenue, costing, grossProfit, totalExpense, netProfit };
}

/**
 * All-time summary of cancelled orders. Cancelling an order never erases its
 * own totalBill/advance/due fields (only the customer's running balance is
 * adjusted) so this history stays available forever for accountability —
 * e.g. when a cancellation was due to a mistake or the customer not
 * collecting their order.
 */
export async function getCancelledOrdersSummary() {
  const [count, agg] = await Promise.all([
    prisma.order.count({ where: { status: "CANCELLED" } }),
    prisma.order.aggregate({
      where: { status: "CANCELLED" },
      _sum: { totalBill: true, advance: true, due: true },
    }),
  ]);

  return {
    count,
    totalBill: Number(agg._sum.totalBill ?? 0),
    totalAdvance: Number(agg._sum.advance ?? 0),
    totalDue: Number(agg._sum.due ?? 0),
  };
}

/** List of cancelled orders with full historical figures, most recent first. */
export async function getCancelledOrdersList(limit = 100) {
  const rows = await prisma.order.findMany({
    where: { status: "CANCELLED" },
    include: { customer: { select: { name: true, mobile: true } } },
    orderBy: { updatedAt: "desc" },
    take: limit,
  });

  return rows.map((o) => ({
    id: o.id,
    orderId: o.orderId,
    customerName: o.customer.name,
    customerMobile: o.customer.mobile,
    totalBill: Number(o.totalBill),
    advance: Number(o.advance),
    due: Number(o.due),
    date: o.date.toISOString().slice(0, 10),
  }));
}

export async function getStaffPerformance() {
  const now = new Date();
  const start = startOfMonth(now);
  const end = addMonths(now, 1);

  const staff = await prisma.user.findMany({
    where: { isActive: true },
    select: { id: true, name: true, role: true },
    orderBy: { name: "asc" },
  });

  return Promise.all(
    staff.map(async (s) => {
      const [ordersTaken, deliveredOrders, collectionAgg] = await Promise.all([
        prisma.order.count({ where: { orderTakenById: s.id, date: { gte: start, lt: end } } }),
        prisma.order.count({
          where: { orderTakenById: s.id, date: { gte: start, lt: end }, status: "DELIVERED" },
        }),
        prisma.order.aggregate({
          _sum: { advance: true },
          where: { orderTakenById: s.id, date: { gte: start, lt: end } },
        }),
      ]);

      return {
        id: s.id,
        name: s.name,
        role: s.role,
        ordersTaken,
        deliveredOrders,
        collections: Number(collectionAgg._sum.advance ?? 0),
      };
    })
  );
}
