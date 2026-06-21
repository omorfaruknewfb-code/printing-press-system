import { prisma } from "@/lib/prisma";
import { OrderStatus, Prisma } from "@prisma/client";

export async function searchCustomers(query: string) {
  if (!query || query.trim().length === 0) return [];

  return prisma.customer.findMany({
    where: {
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { mobile: { contains: query } },
      ],
    },
    select: { id: true, name: true, mobile: true, address: true },
    take: 8,
    orderBy: { name: "asc" },
  });
}

export async function searchItems(query: string) {
  if (!query || query.trim().length === 0) {
    return prisma.itemMaster.findMany({ take: 8, orderBy: { itemName: "asc" } });
  }

  return prisma.itemMaster.findMany({
    where: { itemName: { contains: query, mode: "insensitive" } },
    take: 8,
    orderBy: { itemName: "asc" },
  });
}

export async function getActiveUsers() {
  return prisma.user.findMany({
    where: { isActive: true },
    select: { id: true, name: true, role: true },
    orderBy: { name: "asc" },
  });
}

interface OrderFilters {
  search?: string;
  status?: OrderStatus | "ALL";
  dateFrom?: string;
  dateTo?: string;
}

const ORDER_INCLUDE = {
  customer: { select: { name: true, mobile: true } },
  orderTakenBy: { select: { name: true } },
  assignedTo: { select: { name: true } },
  items: true,
} satisfies Prisma.OrderInclude;

export async function getOrders(filters: OrderFilters) {
  const where: Prisma.OrderWhereInput = {};

  if (filters.status && filters.status !== "ALL") {
    where.status = filters.status;
  }

  if (filters.dateFrom || filters.dateTo) {
    where.date = {
      ...(filters.dateFrom ? { gte: new Date(filters.dateFrom) } : {}),
      ...(filters.dateTo ? { lte: new Date(filters.dateTo) } : {}),
    };
  }

  if (filters.search) {
    where.OR = [
      { orderId: { contains: filters.search, mode: "insensitive" } },
      { items: { some: { itemName: { contains: filters.search, mode: "insensitive" } } } },
      { customer: { name: { contains: filters.search, mode: "insensitive" } } },
      { customer: { mobile: { contains: filters.search } } },
    ];
  }

  return prisma.order.findMany({
    where,
    include: ORDER_INCLUDE,
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export async function getPendingOrders() {
  return prisma.order.findMany({
    where: { status: { in: ["CONFIRMED", "READY_FOR_DELIVERY"] } },
    include: ORDER_INCLUDE,
    orderBy: { deliveryDate: "asc" },
  });
}

export async function getOrderById(id: string) {
  return prisma.order.findUnique({
    where: { id },
    include: ORDER_INCLUDE,
  });
}
