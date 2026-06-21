"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/permissions";
import { paymentInputSchema, PaymentInput } from "@/lib/validators/payment";

type ActionResult = { success: true } | { success: false; error: string };

export async function addPayment(rawInput: PaymentInput): Promise<ActionResult> {
  const user = await requireAuth();

  const parsed = paymentInputSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }
  const input = parsed.data;

  // Staff may only collect payment against an order they personally took,
  // and only when an orderId is given (general, order-less payments stay
  // Admin-only since they touch an arbitrary customer balance).
  if (user.role === "STAFF") {
    if (!input.orderId) {
      return { success: false, error: "Staff can only collect payment against a specific order." };
    }
    const order = await prisma.order.findUnique({ where: { id: input.orderId } });
    if (!order || order.orderTakenById !== user.id) {
      return { success: false, error: "You can only collect payment on orders you took." };
    }
  }

  try {
    await prisma.$transaction(async (tx) => {
      let billAmount = input.paidAmount;

      if (input.orderId) {
        const order = await tx.order.findUnique({ where: { id: input.orderId } });
        if (order) {
          if (order.status === "CANCELLED") {
            throw new Error("Cannot collect payment on a cancelled order.");
          }
          if (input.paidAmount > Number(order.due)) {
            throw new Error("Paid amount cannot exceed the order's due amount.");
          }
          billAmount = Number(order.totalBill);
          await tx.order.update({
            where: { id: input.orderId },
            data: {
              advance: { increment: input.paidAmount },
              due: { decrement: input.paidAmount },
            },
          });
        }
      }

      await tx.customerPayment.create({
        data: {
          customerId: input.customerId,
          orderId: input.orderId || null,
          billAmount,
          paidAmount: input.paidAmount,
          dueAmount: billAmount - input.paidAmount,
          remarks: input.remarks,
          paymentDate: new Date(input.paymentDate),
          collectedById: user.id,
        },
      });

      await tx.customer.update({
        where: { id: input.customerId },
        data: {
          totalPaid: { increment: input.paidAmount },
          totalDue: { decrement: input.paidAmount },
        },
      });
    });

    revalidatePath("/customers");
    revalidatePath("/dashboard");
    revalidatePath("/orders");
    revalidatePath("/my-collection");
    revalidatePath("/pending-works");

    return { success: true };
  } catch (error) {
    console.error("addPayment failed:", error);
    const message = error instanceof Error ? error.message : "Could not record the payment. Please try again.";
    return { success: false, error: message };
  }
}
