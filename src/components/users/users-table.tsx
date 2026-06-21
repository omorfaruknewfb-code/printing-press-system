"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Loader2 } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { UserForm } from "@/components/users/user-form";
import { setUserActive } from "@/actions/user-actions";
import { cn } from "@/lib/utils";

interface PlainUser {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "STAFF";
  isActive: boolean;
  commissionRate: number;
  createdAt: string;
}

export function UsersTable({ users, currentUserId }: { users: PlainUser[]; currentUserId: string }) {
  const router = useRouter();
  const [addOpen, setAddOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<PlainUser | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  async function handleToggleActive(user: PlainUser) {
    const nextActive = !user.isActive;
    if (!nextActive) {
      const confirmed = window.confirm(`Deactivate ${user.name}? They won't be able to log in.`);
      if (!confirmed) return;
    }

    setTogglingId(user.id);
    const result = await setUserActive(user.id, nextActive);
    setTogglingId(null);

    if (!result.success) {
      alert(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Add Staff
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Staff</DialogTitle>
            </DialogHeader>
            <UserForm
              mode="create"
              onSuccess={() => {
                setAddOpen(false);
                router.refresh();
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full min-w-[700px] text-sm">
            <thead className="border-b border-gray-100 bg-gray-50 text-left text-xs font-medium uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Commission</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Joined</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {user.name}
                    {user.id === currentUserId && <span className="ml-2 text-xs text-gray-400">(you)</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-700">{user.email}</td>
                  <td className="px-4 py-3 text-gray-700">{user.role}</td>
                  <td className="px-4 py-3 text-gray-700">
                    {user.role === "STAFF" ? `${user.commissionRate}%` : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                        user.isActive ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"
                      )}
                    >
                      {user.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{user.createdAt}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setEditingUser(user)}
                        className="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-[#1E40AF]"
                        aria-label="Edit user"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleToggleActive(user)}
                        disabled={togglingId === user.id || (user.id === currentUserId && user.isActive)}
                        className={cn(
                          "rounded px-2 py-1 text-xs font-medium",
                          user.isActive
                            ? "text-red-600 hover:bg-red-50"
                            : "text-emerald-600 hover:bg-emerald-50"
                        )}
                      >
                        {togglingId === user.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : user.isActive ? (
                          "Deactivate"
                        ) : (
                          "Activate"
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          {editingUser && (
            <UserForm
              mode="edit"
              userId={editingUser.id}
              initialValues={{
                name: editingUser.name,
                email: editingUser.email,
                role: editingUser.role,
                commissionRate: editingUser.commissionRate,
              }}
              onSuccess={() => {
                setEditingUser(null);
                router.refresh();
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
