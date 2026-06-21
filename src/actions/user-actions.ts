"use server";

import bcrypt from "bcrypt";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/permissions";
import { createUserSchema, CreateUserInput, updateUserSchema, UpdateUserInput } from "@/lib/validators/user";

type ActionResult = { success: true } | { success: false; error: string };

export async function createUser(rawInput: CreateUserInput): Promise<ActionResult> {
  await requireRole("ADMIN");

  const parsed = createUserSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }
  const input = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    return { success: false, error: "A user with this email already exists." };
  }

  const passwordHash = await bcrypt.hash(input.password, 10);

  try {
    await prisma.user.create({
      data: { name: input.name, email: input.email, passwordHash, role: input.role },
    });
    revalidatePath("/users");
    return { success: true };
  } catch (error) {
    console.error("createUser failed:", error);
    return { success: false, error: "Could not create the user." };
  }
}

export async function updateUser(userId: string, rawInput: UpdateUserInput): Promise<ActionResult> {
  await requireRole("ADMIN");

  const parsed = updateUserSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }
  const input = parsed.data;

  const existing = await prisma.user.findFirst({
    where: { email: input.email, NOT: { id: userId } },
  });
  if (existing) {
    return { success: false, error: "Another user already uses this email." };
  }

  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        name: input.name,
        email: input.email,
        role: input.role,
        commissionRate: input.commissionRate,
        ...(input.password ? { passwordHash: await bcrypt.hash(input.password, 10) } : {}),
      },
    });
    revalidatePath("/users");
    return { success: true };
  } catch (error) {
    console.error("updateUser failed:", error);
    return { success: false, error: "Could not update the user." };
  }
}

export async function setUserActive(userId: string, isActive: boolean): Promise<ActionResult> {
  const admin = await requireRole("ADMIN");

  if (admin.id === userId && !isActive) {
    return { success: false, error: "You cannot deactivate your own account." };
  }

  try {
    await prisma.user.update({ where: { id: userId }, data: { isActive } });
    revalidatePath("/users");
    return { success: true };
  } catch (error) {
    console.error("setUserActive failed:", error);
    return { success: false, error: "Could not update the user's status." };
  }
}
