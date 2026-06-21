import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUsers } from "@/lib/users-data";
import { UsersTable } from "@/components/users/users-table";

export default async function UsersPage() {
  const session = await getServerSession(authOptions);
  const users = await getUsers();

  const plainUsers = users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    isActive: u.isActive,
    commissionRate: u.commissionRate,
    createdAt: u.createdAt.toISOString().slice(0, 10),
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">User Management</h1>
          <p className="text-sm text-gray-500">{plainUsers.length} user(s)</p>
        </div>
        <Link
          href="/users/withdrawals"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-[#1E40AF] hover:underline"
        >
          Staff Withdrawal History <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <UsersTable users={plainUsers} currentUserId={session?.user?.id ?? ""} />
    </div>
  );
}
