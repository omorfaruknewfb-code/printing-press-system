import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting data migration: REJECT -> PENDING");

  // Find all orders with REJECT status
  const rejectOrders = await prisma.order.findMany({
    where: { status: "REJECT" },
  });

  console.log(`Found ${rejectOrders.length} orders with REJECT status`);

  if (rejectOrders.length === 0) {
    console.log("No REJECT orders found. Migration complete.");
    return;
  }

  // Update all REJECT orders to PENDING
  const result = await prisma.order.updateMany({
    where: { status: "REJECT" },
    data: { status: "PENDING" },
  });

  console.log(`Updated ${result.count} orders from REJECT to PENDING`);

  // Create status history entries for migrated orders
  for (const order of rejectOrders) {
    await prisma.orderStatusHistory.create({
      data: {
        orderId: order.id,
        oldStatus: "REJECT",
        newStatus: "PENDING",
        changedBy: order.orderTakenById, // Use the original order taker
        remarks: "Migrated from REJECT to PENDING during system update",
      },
    });
  }

  console.log("Created status history entries for migrated orders");
  console.log("Data migration complete!");
}

main()
  .catch((e) => {
    console.error("Migration failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
