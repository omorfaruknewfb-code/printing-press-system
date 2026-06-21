import Link from "next/link";
import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  accent?: "default" | "warning" | "success" | "danger";
  /** Optional URL — when provided the card becomes a clickable link */
  href?: string;
}

const accentStyles: Record<string, string> = {
  default: "bg-blue-50 text-[#1E40AF]",
  warning: "bg-amber-50 text-amber-600",
  success: "bg-emerald-50 text-emerald-600",
  danger: "bg-red-50 text-red-600",
};

export function KpiCard({ label, value, icon: Icon, accent = "default", href }: KpiCardProps) {
  const inner = (
    <CardContent className="flex items-center gap-4 py-5">
      <div className={cn("flex h-11 w-11 items-center justify-center rounded-lg", accentStyles[accent])}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-xl font-semibold text-gray-900">{value}</p>
      </div>
    </CardContent>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        <Card className="transition-shadow hover:shadow-md cursor-pointer">
          {inner}
        </Card>
      </Link>
    );
  }

  return <Card>{inner}</Card>;
}
