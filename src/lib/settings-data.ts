import { prisma } from "@/lib/prisma";

export async function getSettings() {
  const settings = await prisma.settings.upsert({
    where: { id: "default" },
    update: {},
    create: { id: "default" },
  });
  return settings;
}
