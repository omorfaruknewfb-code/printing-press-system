"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole } from "@/lib/permissions";
import {
  orderInputSchema,
  orderStatusSchema,
  costingInputSchema,
  OrderInput,
  CostingInput,
} from "@/lib/validators/order";
import { generateNextOrderId } from "@/lib/order-id";

type ActionResult = { success: true; orderId?: string } | { success: false; error: string };

async function upsertCustomer(
  tx: Prisma.TransactionClient,
  data: { name: string; mobile: string; address?: string }
) {
  return tx.customer.upsert({
    where: { mobile: data.mobile },
    update: { name: data.name, address: data.address ?? undefined },
    create: { name: data.name, mobile: data.mobile, address: data.address },
  });
}

async function upsertItems(tx: Prisma.TransactionClient, itemNames: string[]) {
  for (const itemName of Array.from(new Set(itemNames))) {
    await tx.itemMaster.upsert({
      where: { itemName },
      update: {},
      create: { itemName },
    });
  }
}

function computeTotalBill(items: OrderInput["items"]) {
  return items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
}

export async function createOrder(rawInput: OrderInput): Promise<ActionResult> {
  const user = await requireAuth(); // ADMIN and STAFF can both create orders

  const parsed = orderInputSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }
  const input = parsed.data;

  const totalBill = computeTotalBill(input.items);
  // Staff cannot set Total Costing at creation time — they can add it later
  // via updateOwnOrderCosting, scoped to only their own order (Security Rule 1).
  const totalCosting = user.role === "ADMIN" ? input.totalCosting ?? 0 : 0;
  const costingSet = user.role === "ADMIN" && input.totalCosting !== undefined;

  // Prevent negative due amount
  if (input.advance > totalBill) {
    return { success: false, error: "Advance cannot exceed total bill amount." };
  }
  const due = totalBill - input.advance;

  // Set status based on advance payment
  const initialStatus = input.advance > 0 ? "CONFIRMED" : "PENDING";

  try {
    const result = await prisma.$transaction(async (tx) => {
      const customer = await upsertCustomer(tx, {
        name: input.customerName,
        mobile: input.customerMobile,
        address: input.customerAddress,
      });

      await upsertItems(tx, input.items.map((i) => i.itemName));

      const orderId = await generateNextOrderId(tx);

      const order = await tx.order.create({
        data: {
          orderId,
          date: new Date(),
          customerId: customer.id,
          totalBill,
          advance: input.advance,
          due,
          totalCosting,
          costingSet,
          deliveryDate: new Date(input.deliveryDate),
          status: initialStatus,
          orderTakenById: user.id,
          assignedToId: user.role === "ADMIN" ? input.assignedToId || null : null,
          items: {
            create: input.items.map((item) => ({
              itemName: item.itemName,
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              lineTotal: item.quantity * item.unitPrice,
            })),
          },
          statusHistory: {
            create: {
              oldStatus: null,
              newStatus: initialStatus,
              changedBy: user.id,
              remarks: initialStatus === "CONFIRMED" ? "Order created with advance payment" : "Order created without advance payment",
            },
          },
        },
      });

      await tx.customer.update({
        where: { id: customer.id },
        data: {
          totalOrders: { increment: 1 },
          totalBill: { increment: totalBill },
          totalPaid: { increment: input.advance },
          totalDue: { increment: due },
        },
      });

      return order;
    });

    revalidatePath("/orders");
    revalidatePath("/pending-works");
    revalidatePath("/dashboard");
    revalidatePath("/customers");
    revalidatePath("/my-collection");

    return { success: true, orderId: result.orderId };
  } catch (error) {
    console.error("createOrder failed:", error);
    return { success: false, error: "Could not save the order. Please try again." };
  }
}

export async function updateOrder(orderDbId: string, rawInput: OrderInput): Promise<ActionResult> {
  await requireRole("ADMIN"); // Only Admin can edit a saved order (Section 7)

  const parsed = orderInputSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }
  const input = parsed.data;
  const totalBill = computeTotalBill(input.items);

  // Prevent negative due amount (same rule as createOrder)
  if (input.advance > totalBill) {
    return { success: false, error: "Advance cannot exceed total bill amount." };
  }

  const due = totalBill - input.advance;
  const totalCosting = input.totalCosting ?? 0;

  try {
    await prisma.$transaction(async (tx) => {
      const existing = await tx.order.findUniqueOrThrow({ where: { id: orderDbId } });

      const customer = await upsertCustomer(tx, {
        name: input.customerName,
        mobile: input.customerMobile,
        address: input.customerAddress,
      });

      await upsertItems(tx, input.items.map((i) => i.itemName));

      await tx.orderItem.deleteMany({ where: { orderId: orderDbId } });

      await tx.order.update({
        where: { id: orderDbId },
        data: {
          customerId: customer.id,
          totalBill,
          advance: input.advance,
          due,
          totalCosting,
          costingSet: true,
          deliveryDate: new Date(input.deliveryDate),
          assignedToId: input.assignedToId || null,
          items: {
            create: input.items.map((item) => ({
              itemName: item.itemName,
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              lineTotal: item.quantity * item.unitPrice,
            })),
          },
        },
      });

      // Reverse the old contribution, then apply the new one — keeps the
      // customer summary correct even if the order was moved to a
      // different customer during the edit.
      await tx.customer.update({
        where: { id: existing.customerId },
        data: {
          totalOrders: { decrement: 1 },
          totalBill: { decrement: existing.totalBill },
          totalPaid: { decrement: existing.advance },
          totalDue: { decrement: existing.due },
        },
      });

      await tx.customer.update({
        where: { id: customer.id },
        data: {
          totalOrders: { increment: 1 },
          totalBill: { increment: totalBill },
          totalPaid: { increment: input.advance },
          totalDue: { increment: due },
        },
      });
    });

    revalidatePath("/orders");
    revalidatePath("/pending-works");
    revalidatePath("/dashboard");
    revalidatePath("/customers");
    revalidatePath("/my-collection");

    return { success: true };
  } catch (error) {
    console.error("updateOrder failed:", error);
    return { success: false, error: "Could not update the order. Please try again." };
  }
}

// Lightweight Costing-only update — lets Staff add/correct the costing on
// their OWN orders without touching anything else (Customer, Items, Bill).
// Admin can use this on any order.
export async function updateOrderCosting(rawInput: CostingInput): Promise<ActionResult> {
  const user = await requireAuth();

  const parsed = costingInputSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }
  const { orderDbId, totalCosting } = parsed.data;

  const order = await prisma.order.findUnique({ where: { id: orderDbId } });
  if (!order) {
    return { success: false, error: "Order not found." };
  }

  if (user.role === "STAFF" && order.orderTakenById !== user.id) {
    return { success: false, error: "You can only set costing on orders you took." };
  }

  try {
    await prisma.order.update({
      where: { id: orderDbId },
      data: { totalCosting, costingSet: true },
    });

    revalidatePath("/orders");
    revalidatePath("/my-collection");
    revalidatePath("/reports");

    return { success: true };
  } catch (error) {
    console.error("updateOrderCosting failed:", error);
    return { success: false, error: "Could not save the costing." };
  }
}

export async function updateOrderStatus(
  orderDbId: string,
  newStatus: "PENDING" | "CONFIRMED" | "READY_FOR_DELIVERY" | "DELIVERED" | "CANCELLED"
): Promise<ActionResult> {
  const user = await requireAuth();

  const parsed = orderStatusSchema.safeParse({ orderId: orderDbId, status: newStatus });
  if (!parsed.success) {
    return { success: false, error: "Invalid status" };
  }

  const order = await prisma.order.findUnique({ where: { id: orderDbId } });
  if (!order) {
    return { success: false, error: "Order not found" };
  }

  // Define allowed status transitions
  const allowedTransitions: Record<string, string[]> = {
    PENDING: ["CONFIRMED", "CANCELLED"],
    CONFIRMED: ["READY_FOR_DELIVERY", "CANCELLED"],
    READY_FOR_DELIVERY: ["DELIVERED"],
    DELIVERED: [],
    CANCELLED: [],
  };

  if (!allowedTransitions[order.status]?.includes(newStatus)) {
    return {
      success: false,
      error: `Cannot change status from ${order.status} to ${newStatus}`,
    };
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: orderDbId },
        data: {
          status: newStatus,
          statusHistory: {
            create: {
              oldStatus: order.status,
              newStatus: newStatus,
              changedBy: user.id,
              remarks: `Status changed from ${order.status} to ${newStatus}`,
            },
          },
        },
      });
    });

    revalidatePath("/orders");
    revalidatePath("/pending-works");
    revalidatePath("/dashboard");
    revalidatePath("/customers");
    revalidatePath("/my-collection");

    return { success: true };
  } catch (error) {
    console.error("updateOrderStatus failed:", error);
    return { success: false, error: "Could not update order status." };
  }
}

export async function cancelOrder(orderDbId: string, remarks?: string): Promise<ActionResult> {
  const user = await requireAuth();

  const order = await prisma.order.findUnique({ where: { id: orderDbId } });
  if (!order) {
    return { success: false, error: "Order not found" };
  }

  // Only PENDING and CONFIRMED orders can be cancelled
  if (order.status !== "PENDING" && order.status !== "CONFIRMED") {
    return {
      success: false,
      error: "Only PENDING and CONFIRMED orders can be cancelled",
    };
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: orderDbId },
        data: {
          status: "CANCELLED",
          statusHistory: {
            create: {
              oldStatus: order.status,
              newStatus: "CANCELLED",
              changedBy: user.id,
              remarks: remarks || "Order cancelled",
            },
          },
        },
      });

      // A cancelled order should no longer count toward the customer's
      // outstanding bill/due — otherwise it stays stuck in their balance
      // forever even though the order was called off. (Advance already
      // collected, if any, is left as-is; refunding it is a separate,
      // explicit action.)
      await tx.customer.update({
        where: { id: order.customerId },
        data: {
          totalBill: { decrement: order.totalBill },
          totalDue: { decrement: order.due },
        },
      });
    });

    revalidatePath("/orders");
    revalidatePath("/pending-works");
    revalidatePath("/dashboard");
    revalidatePath("/customers");
    revalidatePath("/my-collection");

    return { success: true };
  } catch (error) {
    console.error("cancelOrder failed:", error);
    return { success: false, error: "Could not cancel order." };
  }
}

export async function markWorkComplete(orderDbId: string): Promise<ActionResult> {
  const user = await requireAuth();

  const order = await prisma.order.findUnique({ where: { id: orderDbId } });
  if (!order) {
    return { success: false, error: "Order not found" };
  }

  // Only CONFIRMED orders can be marked as work complete
  if (order.status !== "CONFIRMED") {
    return {
      success: false,
      error: "Only CONFIRMED orders can be marked as work complete",
    };
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: orderDbId },
        data: {
          status: "READY_FOR_DELIVERY",
          statusHistory: {
            create: {
              oldStatus: "CONFIRMED",
              newStatus: "READY_FOR_DELIVERY",
              changedBy: user.id,
              remarks: "Work completed, ready for delivery",
            },
          },
        },
      });
    });

    revalidatePath("/orders");
    revalidatePath("/pending-works");
    revalidatePath("/dashboard");
    revalidatePath("/customers");
    revalidatePath("/my-collection");

    return { success: true };
  } catch (error) {
    console.error("markWorkComplete failed:", error);
    return { success: false, error: "Could not mark work as complete." };
  }
}

export async function deliverOrder(
  orderDbId: string,
  paymentAmount: number,
  remarks?: string
): Promise<ActionResult> {
  const user = await requireAuth();

  const order = await prisma.order.findUnique({ where: { id: orderDbId } });
  if (!order) {
    return { success: false, error: "Order not found" };
  }

  // Only READY_FOR_DELIVERY orders can be delivered
  if (order.status !== "READY_FOR_DELIVERY") {
    return {
      success: false,
      error: "Only READY_FOR_DELIVERY orders can be delivered",
    };
  }

  // Validate payment amount
  if (paymentAmount < 0) {
    return { success: false, error: "Payment amount cannot be negative" };
  }
  if (paymentAmount > Number(order.due)) {
    return { success: false, error: "Payment amount cannot exceed the order's due amount." };
  }

  try {
    await prisma.$transaction(async (tx) => {
      // Update order status and due amount
      const newDue = Number(order.due) - paymentAmount;

      await tx.order.update({
        where: { id: orderDbId },
        data: {
          status: "DELIVERED",
          due: newDue,
          statusHistory: {
            create: {
              oldStatus: "READY_FOR_DELIVERY",
              newStatus: "DELIVERED",
              changedBy: user.id,
              remarks: remarks || (paymentAmount > 0 ? `Delivered with payment of ৳${paymentAmount}` : "Delivered without payment"),
            },
          },
        },
      });

      // If payment was made, create a payment record
      if (paymentAmount > 0) {
        await tx.customerPayment.create({
          data: {
            customerId: order.customerId,
            orderId: orderDbId,
            billAmount: order.totalBill,
            paidAmount: paymentAmount,
            dueAmount: newDue,
            remarks: remarks || "Delivery payment",
            paymentDate: new Date(),
            collectedById: user.id,
          },
        });

        // Update customer totals
        await tx.customer.update({
          where: { id: order.customerId },
          data: {
            totalPaid: { increment: paymentAmount },
            totalDue: { decrement: paymentAmount },
          },
        });
      }
    });

    revalidatePath("/orders");
    revalidatePath("/pending-works");
    revalidatePath("/dashboard");
    revalidatePath("/customers");
    revalidatePath("/my-collection");

    return { success: true };
  } catch (error) {
    console.error("deliverOrder failed:", error);
    return { success: false, error: "Could not deliver order." };
  }
}

export async function deleteOrder(orderDbId: string): Promise<ActionResult> {
  await requireRole("ADMIN"); // Only Admin can delete (Section 7)

  try {
    await prisma.$transaction(async (tx) => {
      const existing = await tx.order.findUniqueOrThrow({ where: { id: orderDbId } });

      await tx.customer.update({
        where: { id: existing.customerId },
        data: {
          totalOrders: { decrement: 1 },
          totalBill: { decrement: existing.totalBill },
          totalPaid: { decrement: existing.advance },
          totalDue: { decrement: existing.due },
        },
      });

      await tx.order.delete({ where: { id: orderDbId } });
    });

    revalidatePath("/orders");
    revalidatePath("/pending-works");
    revalidatePath("/dashboard");
    revalidatePath("/customers");
    revalidatePath("/my-collection");

    return { success: true };
  } catch (error) {
    console.error("deleteOrder failed:", error);
    return { success: false, error: "Could not delete the order." };
  }
}

// Order Duplicate — Admin only. Copies the customer + item lines into a
// fresh Pending order with today's date, so a repeat job doesn't need to
// be retyped from scratch.
export async function duplicateOrder(orderDbId: string): Promise<ActionResult> {
  const user = await requireRole("ADMIN");

  try {
    const result = await prisma.$transaction(async (tx) => {
      const original = await tx.order.findUniqueOrThrow({
        where: { id: orderDbId },
        include: { items: true, customer: true },
      });

      const newOrderId = await generateNextOrderId(tx);
      const deliveryDate = new Date();
      deliveryDate.setDate(deliveryDate.getDate() + 2);

      const created = await tx.order.create({
        data: {
          orderId: newOrderId,
          date: new Date(),
          customerId: original.customerId,
          totalBill: original.totalBill,
          advance: 0,
          due: original.totalBill,
          totalCosting: 0,
          costingSet: false,
          deliveryDate,
          orderTakenById: user.id,
          items: {
            create: original.items.map((item) => ({
              itemName: item.itemName,
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              lineTotal: item.lineTotal,
            })),
          },
        },
      });

      await tx.customer.update({
        where: { id: original.customerId },
        data: {
          totalOrders: { increment: 1 },
          totalBill: { increment: original.totalBill },
          totalDue: { increment: original.totalBill },
        },
      });

      return created;
    });

    revalidatePath("/orders");
    revalidatePath("/pending-works");
    revalidatePath("/dashboard");
    revalidatePath("/customers");

    return { success: true, orderId: result.orderId };
  } catch (error) {
    console.error("duplicateOrder failed:", error);
    return { success: false, error: "Could not duplicate the order." };
  }
}
