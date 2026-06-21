import { prisma } from "@/lib/prisma";

export async function getUsers() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      commissionRate: true,
      createdAt: true,
    },
  });

  return users.map((u) => ({ ...u, commissionRate: Number(u.commissionRate) }));
}
