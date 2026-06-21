"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";

interface DashboardShellProps {
  name: string;
  role: "ADMIN" | "STAFF";
  avatarUrl?: string | null;
  orgName: string;
  logoUrl?: string | null;
  children: React.ReactNode;
}

export function DashboardShell({
  name,
  role,
  avatarUrl,
  orgName,
  logoUrl,
  children,
}: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar
        role={role}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        orgName={orgName}
        logoUrl={logoUrl}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <Header name={name} role={role} avatarUrl={avatarUrl} onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
