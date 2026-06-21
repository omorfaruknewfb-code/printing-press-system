"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  PlusCircle,
  ClipboardList,
  Users,
  Wallet,
  Receipt,
  BarChart3,
  UserCog,
  Settings,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
  adminOnly?: boolean;
  staffOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Orders", href: "/orders", icon: FileText, adminOnly: true },
  { label: "New Order", href: "/orders/new", icon: PlusCircle, staffOnly: true },
  { label: "Pending Works", href: "/pending-works", icon: ClipboardList },
  { label: "Customers", href: "/customers", icon: Users, adminOnly: true },
  { label: "My Collection", href: "/my-collection", icon: Wallet, staffOnly: true },
  { label: "Expenses", href: "/expenses", icon: Receipt, adminOnly: true },
  { label: "Reports", href: "/reports", icon: BarChart3, adminOnly: true },
  { label: "User Management", href: "/users", icon: UserCog, adminOnly: true },
  { label: "Org Settings", href: "/settings", icon: Settings, adminOnly: true },
];

interface SidebarProps {
  role: "ADMIN" | "STAFF";
  isOpen: boolean;
  onClose: () => void;
  orgName: string;
  logoUrl?: string | null;
}

export function Sidebar({ role, isOpen, onClose, orgName, logoUrl }: SidebarProps) {
  const pathname = usePathname();

  const items = NAV_ITEMS.filter((item) => {
    if (item.adminOnly && role !== "ADMIN") return false;
    if (item.staffOnly && role !== "STAFF") return false;
    return true;
  });

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/30 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 transform border-r border-gray-200 bg-white transition-transform lg:static lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-gray-100 px-5">
          <div className="flex min-w-0 items-center gap-2">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt={orgName} className="h-7 w-7 flex-shrink-0 rounded-full object-cover" />
            ) : null}
            <span className="truncate text-sm font-semibold text-gray-900">{orgName}</span>
          </div>
          <button onClick={onClose} className="lg:hidden" aria-label="Close menu">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <nav className="space-y-1 px-3 py-4">
          {items.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-blue-50 text-[#1E40AF]"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
