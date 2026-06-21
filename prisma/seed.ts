import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const adminPassword = process.env.ADMIN_SEED_PASSWORD || "Admin@123";
  const staffPassword = process.env.STAFF_SEED_PASSWORD || "Staff@123";
  const adminPasswordHash = await bcrypt.hash(adminPassword, 10);
  const staffPasswordHash = await bcrypt.hash(staffPassword, 10);

  await prisma.user.upsert({
    where: { email: "admin@alihsan.com" },
    update: {},
    create: {
      name: "Administrator",
      email: "admin@alihsan.com",
      passwordHash: adminPasswordHash,
      role: Role.ADMIN,
    },
  });

  // Test staff account so the Staff role restrictions can be verified
  // without waiting for the User Management module to be built.
  await prisma.user.upsert({
    where: { email: "staff@alihsan.com" },
    update: {},
    create: {
      name: "Test Staff",
      email: "staff@alihsan.com",
      passwordHash: staffPasswordHash,
      role: Role.STAFF,
    },
  });

  // Default expense categories (Batch B: categories are now DB-managed via
  // the ExpenseCategory model instead of a hardcoded list). Safe to re-run.
  const defaultCategories = [
    "Paper Purchase",
    "Ink Purchase",
    "Electricity",
    "Transport",
    "Miscellaneous",
    "Staff Payment",
  ];
  for (const name of defaultCategories) {
    await prisma.expenseCategory.upsert({ where: { name }, update: {}, create: { name } });
  }

  console.log("Seed complete:");
  console.log("Admin -> admin@alihsan.com / Admin@123");
  console.log("Staff -> staff@alihsan.com / Staff@123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
