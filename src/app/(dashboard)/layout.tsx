import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings-data";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  // middleware already protects these routes; this is a second, independent
  // server-side check (Rule 7 — never rely on a single layer of protection).
  if (!session?.user) {
    redirect("/login");
  }

  const [settings, dbUser] = await Promise.all([
    getSettings(),
    prisma.user.findUnique({ where: { id: session.user.id }, select: { avatarUrl: true } }),
  ]);

  return (
    <DashboardShell
      name={session.user.name ?? ""}
      role={session.user.role}
      avatarUrl={dbUser?.avatarUrl}
      orgName={settings.orgName}
      logoUrl={settings.logoUrl}
    >
      {children}
    </DashboardShell>
  );
}
