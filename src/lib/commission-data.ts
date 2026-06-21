import { prisma } from "@/lib/prisma";

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function startOfNextMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 1);
}

/**
 * Profit for a staff member's own orders this month = totalBill - totalCosting,
 * counted only for orders where costing has actually been set.
 * Commission = profit * commissionRate / 100.
 */
export async function getStaffMonthlyCommission(userId: string) {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = startOfNextMonth(now);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { commissionRate: true },
  });
  const commissionRate = Number(user?.commissionRate ?? 0);

  const orders = await prisma.order.findMany({
    where: {
      orderTakenById: userId,
      costingSet: true,
      date: { gte: monthStart, lt: monthEnd },
    },
    select: { totalBill: true, totalCosting: true },
  });

  const profit = orders.reduce(
    (sum, o) => sum + (Number(o.totalBill) - Number(o.totalCosting)),
    0
  );

  const commissionEarned = (profit * commissionRate) / 100;

  const withdrawnAgg = await prisma.staffWithdrawal.aggregate({
    _sum: { amount: true },
    where: {
      staffId: userId,
      type: "COMMISSION",
      date: { gte: monthStart, lt: monthEnd },
    },
  });
  const commissionWithdrawn = Number(withdrawnAgg._sum.amount ?? 0);

  return {
    commissionRate,
    profit,
    commissionEarned,
    commissionWithdrawn,
    commissionRemaining: commissionEarned - commissionWithdrawn,
  };
}

export async function getMyWithdrawals(userId: string) {
  const rows = await prisma.staffWithdrawal.findMany({
    where: { staffId: userId },
    orderBy: { date: "desc" },
    take: 50,
  });

  return rows.map((w) => ({
    id: w.id,
    type: w.type,
    amount: Number(w.amount),
    date: w.date.toISOString().slice(0, 10),
    remarks: w.remarks ?? "",
    editedByAdmin: w.editedByAdmin,
  }));
}

export async function getAllStaffCommissionSummaries() {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = startOfNextMonth(now);

  const staff = await prisma.user.findMany({
    where: { role: "STAFF" },
    select: { id: true, name: true, commissionRate: true },
    orderBy: { name: "asc" },
  });

  // Fetch all relevant data in single queries to avoid N+1 pattern
  const [allOrders, allWithdrawals] = await Promise.all([
    prisma.order.findMany({
      where: {
        orderTakenById: { in: staff.map(s => s.id) },
        costingSet: true,
        date: { gte: monthStart, lt: monthEnd },
      },
      select: { orderTakenById: true, totalBill: true, totalCosting: true },
    }),
    prisma.staffWithdrawal.findMany({
      where: {
        staffId: { in: staff.map(s => s.id) },
        type: "COMMISSION",
        date: { gte: monthStart, lt: monthEnd },
      },
      select: { staffId: true, amount: true },
    }),
  ]);

  // Group by staff and calculate summaries
  const summaries = staff.map((s) => {
    const commissionRate = Number(s.commissionRate ?? 0);
    
    const staffOrders = allOrders.filter(o => o.orderTakenById === s.id);
    const profit = staffOrders.reduce(
      (sum, o) => sum + (Number(o.totalBill) - Number(o.totalCosting)),
      0
    );
    const commissionEarned = (profit * commissionRate) / 100;

    const staffWithdrawals = allWithdrawals.filter(w => w.staffId === s.id);
    const commissionWithdrawn = staffWithdrawals.reduce(
      (sum, w) => sum + Number(w.amount),
      0
    );

    return {
      staffId: s.id,
      staffName: s.name,
      commissionRate,
      profit,
      commissionEarned,
      commissionWithdrawn,
      commissionRemaining: commissionEarned - commissionWithdrawn,
    };
  });

  return summaries;
}

export async function getAllWithdrawals() {
  const rows = await prisma.staffWithdrawal.findMany({
    include: { staff: { select: { name: true } } },
    orderBy: { date: "desc" },
    take: 300,
  });

  return rows.map((w) => ({
    id: w.id,
    staffId: w.staffId,
    staffName: w.staff.name,
    type: w.type,
    amount: Number(w.amount),
    date: w.date.toISOString().slice(0, 10),
    remarks: w.remarks ?? "",
    editedByAdmin: w.editedByAdmin,
  }));
}
