import { Prisma } from "@prisma/client";

// Atomically reserves the next Order ID inside the given transaction.
// Uses a single INSERT ... ON CONFLICT statement so Postgres itself
// serializes concurrent callers — two simultaneous orders can never
// receive the same ID.
export async function generateNextOrderId(tx: Prisma.TransactionClient): Promise<string> {
  const result = await tx.$queryRaw<{ value: number }[]>`
    INSERT INTO "counters" (name, value)
    VALUES ('order', (SELECT COUNT(*) FROM "orders") + 1)
    ON CONFLICT (name) DO UPDATE SET value = "counters".value + 1
    RETURNING value;
  `;
  const nextValue = result[0].value;
  return `ORD-${String(nextValue).padStart(4, "0")}`;
}
