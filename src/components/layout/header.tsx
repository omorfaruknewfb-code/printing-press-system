"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  name: string;
  role: "ADMIN" | "STAFF";
  avatarUrl?: string | null;
  onMenuClick: () => void;
}

export function Header({ name, role, avatarUrl, onMenuClick }: HeaderProps) {
  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 lg:px-6">
      <button onClick={onMenuClick} className="lg:hidden" aria-label="Open menu">
        <Menu className="h-5 w-5 text-gray-600" />
      </button>

      <div className="hidden lg:block" />

      <div className="flex items-center gap-3">
        <Link href="/profile" className="flex items-center gap-2">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt={name} className="h-8 w-8 rounded-full object-cover" />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-xs font-medium text-[#1E40AF]">
              {name.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="text-right">
            <p className="text-sm font-medium text-gray-900">{name}</p>
            <p className="text-xs text-gray-500">{role}</p>
          </div>
        </Link>
        <Button variant="outline" size="sm" onClick={() => signOut({ callbackUrl: "/login" })}>
          Logout
        </Button>
      </div>
    </header>
  );
}
