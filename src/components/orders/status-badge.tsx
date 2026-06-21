import { cn } from "@/lib/utils";
import { Clock, CheckCircle, Package, CheckCircle2, X } from "lucide-react";

const STYLES: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-700",
  CONFIRMED: "bg-blue-50 text-blue-700",
  READY_FOR_DELIVERY: "bg-purple-50 text-purple-700",
  DELIVERED: "bg-emerald-50 text-emerald-700",
  CANCELLED: "bg-red-50 text-red-700",
};

const ICONS: Record<string, React.ReactNode> = {
  PENDING: <Clock className="h-3 w-3 mr-1" />,
  CONFIRMED: <CheckCircle className="h-3 w-3 mr-1" />,
  READY_FOR_DELIVERY: <Package className="h-3 w-3 mr-1" />,
  DELIVERED: <CheckCircle2 className="h-3 w-3 mr-1" />,
  CANCELLED: <X className="h-3 w-3 mr-1" />,
};

export function StatusBadge({ status }: { status: "PENDING" | "CONFIRMED" | "READY_FOR_DELIVERY" | "DELIVERED" | "CANCELLED" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        STYLES[status]
      )}
    >
      {ICONS[status]}
      {status.replace(/_/g, " ")}
    </span>
  );
}
