"use server";

import bcrypt from "bcrypt";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole } from "@/lib/permissions";
import {
  updateProfileSchema,
  UpdateProfileInput,
  changePasswordSchema,
  ChangePasswordInput,
  orgSettingsSchema,
  OrgSettingsInput,
} from "@/lib/validators/profile";

type ActionResult = { success: true } | { success: false; error: string };

export async function updateOwnProfile(rawInput: UpdateProfileInput): Promise<ActionResult> {
  const user = await requireAuth();

  const parsed = updateProfileSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }

  try {
    await prisma.user.update({
      where: { id: user.id },
      data: { name: parsed.data.name, avatarUrl: parsed.data.avatarUrl },
    });
    revalidatePath("/profile");
    return { success: true };
  } catch (error) {
    console.error("updateOwnProfile failed:", error);
    return { success: false, error: "Could not update your profile." };
  }
}

export async function changeOwnPassword(rawInput: ChangePasswordInput): Promise<ActionResult> {
  const user = await requireAuth();

  const parsed = changePasswordSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!dbUser) {
    return { success: false, error: "User not found." };
  }

  const isCurrentValid = await bcrypt.compare(parsed.data.currentPassword, dbUser.passwordHash);
  if (!isCurrentValid) {
    return { success: false, error: "Your current password is incorrect." };
  }

  try {
    const passwordHash = await bcrypt.hash(parsed.data.newPassword, 10);
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
    return { success: true };
  } catch (error) {
    console.error("changeOwnPassword failed:", error);
    return { success: false, error: "Could not change your password." };
  }
}

export async function updateOrgSettings(rawInput: OrgSettingsInput): Promise<ActionResult> {
  await requireRole("ADMIN");

  const parsed = orgSettingsSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }

  try {
    await prisma.settings.upsert({
      where: { id: "default" },
      update: { orgName: parsed.data.orgName, logoUrl: parsed.data.logoUrl },
      create: { id: "default", orgName: parsed.data.orgName, logoUrl: parsed.data.logoUrl },
    });
    revalidatePath("/", "layout");
    return { success: true };
  } catch (error) {
    console.error("updateOrgSettings failed:", error);
    return { success: false, error: "Could not update organization settings." };
  }
}
