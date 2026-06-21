"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole } from "@/lib/permissions";
import { withdrawalInputSchema, WithdrawalInput } from "@/lib/validators/withdrawal";
import { getStaffMonthlyCommission } from "@/lib/commission-data";

type ActionResult = { success: true } | { success: false; error: string };

/**
 * Staff requests a withdrawal (commission / salary / other). This is recorded
 * in StaffWithdrawal AND mirrored into Expense (category "Staff Payment") so
 * it's reflected in company-wide expense totals. Both writes happen in a
 * single transaction, and the withdrawal stores a link to its mirrored
 * Expense row (relatedExpenseId) so future edits/deletes can keep both
 * records in sync instead of drifting apart.
 */
export async function createWithdrawal(rawInput: WithdrawalInput): Promise<ActionResult> {
  const user = await requireAuth();

  const parsed = withdrawalInputSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }
  const input = parsed.data;

  // A staff member cannot withdraw more commission than they have actually
  // earned (this was previously unchecked, allowing unlimited withdrawals).
  if (input.type === "COMMISSION") {
    const { commissionRemaining } = await getStaffMonthlyCommission(user.id);
    if (input.amount > commissionRemaining) {
      return {
        success: false,
        error: `You can withdraw at most ৳${commissionRemaining.toFixed(2)} of commission this month.`,
      };
    }
  }

  try {
    await prisma.$transaction(async (tx) => {
      // Ensure "Staff Payment" category exists before creating expense
      const staffPaymentCategory = await tx.expenseCategory.findUnique({
        where: { name: "Staff Payment" },
      });
      if (!staffPaymentCategory) {
        await tx.expenseCategory.create({
          data: { name: "Staff Payment" },
        });
      }

      const expense = await tx.expense.create({
        data: {
          date: new Date(input.date),
          category: "Staff Payment",
          amount: input.amount,
          description: `${input.type} withdrawal by ${user.name}${input.remarks ? ` — ${input.remarks}` : ""}`,
          createdById: user.id,
        },
      });

      await tx.staffWithdrawal.create({
        data: {
          staffId: user.id,
          type: input.type,
          amount: input.amount,
          date: new Date(input.date),
          remarks: input.remarks,
          relatedExpenseId: expense.id,
        },
      });
    });

    revalidatePath("/my-collection");
    revalidatePath("/expenses");
    revalidatePath("/reports");
    revalidatePath("/users/withdrawals");
    return { success: true };
  } catch (error) {
    console.error("createWithdrawal failed:", error);
    return { success: false, error: "Could not save the withdrawal." };
  }
}

/**
 * Admin-only edit of any staff member's withdrawal entry. Sets editedByAdmin
 * so staff can see the entry was changed by an admin. The linked Expense row
 * (if one exists) is updated in the same transaction so company expense
 * totals never drift out of sync with the withdrawal record.
 */
export async function adminUpdateWithdrawal(
  withdrawalId: string,
  rawInput: WithdrawalInput
): Promise<ActionResult> {
  await requireRole("ADMIN");

  const parsed = withdrawalInputSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }
  const input = parsed.data;

  try {
    await prisma.$transaction(async (tx) => {
      const existing = await tx.staffWithdrawal.findUniqueOrThrow({
        where: { id: withdrawalId },
        include: { staff: { select: { name: true } } },
      });

      await tx.staffWithdrawal.update({
        where: { id: withdrawalId },
        data: {
          type: input.type,
          amount: input.amount,
          date: new Date(input.date),
          remarks: input.remarks,
          editedByAdmin: true,
        },
      });

      if (existing.relatedExpenseId) {
        await tx.expense.update({
          where: { id: existing.relatedExpenseId },
          data: {
            date: new Date(input.date),
            amount: input.amount,
            description: `${input.type} withdrawal by ${existing.staff.name}${
              input.remarks ? ` — ${input.remarks}` : ""
            } (edited by admin)`,
          },
        });
      }
    });

    revalidatePath("/users/withdrawals");
    revalidatePath("/my-collection");
    revalidatePath("/expenses");
    revalidatePath("/reports");
    return { success: true };
  } catch (error) {
    console.error("adminUpdateWithdrawal failed:", error);
    return { success: false, error: "Could not update the withdrawal." };
  }
}

export async function adminDeleteWithdrawal(withdrawalId: string): Promise<ActionResult> {
  await requireRole("ADMIN");

  try {
    await prisma.$transaction(async (tx) => {
      const existing = await tx.staffWithdrawal.findUniqueOrThrow({ where: { id: withdrawalId } });

      await tx.staffWithdrawal.delete({ where: { id: withdrawalId } });

      if (existing.relatedExpenseId) {
        await tx.expense.delete({ where: { id: existing.relatedExpenseId } }).catch(() => {
          // Expense may have already been deleted independently from the
          // Expenses page — that's fine, nothing left to clean up.
        });
      }
    });

    revalidatePath("/users/withdrawals");
    revalidatePath("/my-collection");
    revalidatePath("/expenses");
    revalidatePath("/reports");
    return { success: true };
  } catch (error) {
    console.error("adminDeleteWithdrawal failed:", error);
    return { success: false, error: "Could not delete the withdrawal." };
  }
}
