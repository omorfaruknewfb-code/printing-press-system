"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/shared/password-input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { createUser, updateUser } from "@/actions/user-actions";

interface UserFormProps {
  mode: "create" | "edit";
  userId?: string;
  initialValues?: { name: string; email: string; role: "ADMIN" | "STAFF"; commissionRate?: number };
  onSuccess: () => void;
}

export function UserForm({ mode, userId, initialValues, onSuccess }: UserFormProps) {
  const [name, setName] = useState(initialValues?.name ?? "");
  const [email, setEmail] = useState(initialValues?.email ?? "");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"ADMIN" | "STAFF">(initialValues?.role ?? "STAFF");
  const [commissionRate, setCommissionRate] = useState(String(initialValues?.commissionRate ?? 0));
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const result =
      mode === "create"
        ? await createUser({ name, email, password, role })
        : await updateUser(userId as string, {
            name,
            email,
            password,
            role,
            commissionRate: Number(commissionRate),
          });

    setIsSubmitting(false);

    if (!result.success) {
      setError(result.error);
      return;
    }
    onSuccess();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">{mode === "create" ? "Password" : "New Password (optional)"}</Label>
        <PasswordInput
          id="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={mode === "edit" ? "Leave blank to keep current password" : undefined}
          required={mode === "create"}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="role">Role</Label>
        <Select id="role" value={role} onChange={(e) => setRole(e.target.value as "ADMIN" | "STAFF")}>
          <option value="STAFF">Staff</option>
          <option value="ADMIN">Admin</option>
        </Select>
      </div>

      {mode === "edit" && role === "STAFF" && (
        <div className="space-y-2">
          <Label htmlFor="commissionRate">Commission Rate (%)</Label>
          <Input
            id="commissionRate"
            type="number"
            min={0}
            max={100}
            step="0.01"
            value={commissionRate}
            onChange={(e) => setCommissionRate(e.target.value)}
          />
          <p className="text-xs text-gray-500">
            Applied to this staff member&apos;s monthly profit (Total Bill − Costing) on orders they took.
          </p>
        </div>
      )}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {mode === "create" ? "Create User" : "Update User"}
      </Button>
    </form>
  );
}
