import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ProfileView } from "@/components/profile/profile-view";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  const user = await prisma.user.findUnique({
    where: { id: session!.user.id },
    select: { id: true, name: true, email: true, role: true, avatarUrl: true },
  });

  if (!user) return null;

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">My Profile</h1>
        <p className="text-sm text-gray-500">Manage your account details</p>
      </div>

      <ProfileView
        name={user.name}
        email={user.email}
        role={user.role}
        avatarUrl={user.avatarUrl}
      />
    </div>
  );
}
