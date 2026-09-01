import React from "react";
import { cn } from "@/lib/utils";
import { CheckCircle2, AlertTriangle, AlertOctagon, Info, WifiOff, PowerOff } from "lucide-react";

export type StatusType = "normal" | "warning" | "critical" | "info" | "offline" | "online" | "inactive";

export interface StatusIndicatorProps {
  status: StatusType;
  label?: string;
  showIcon?: boolean;
  size?: "sm" | "md";
  className?: string;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  label,
  showIcon = true,
  size = "md",
  className,
}) => {
  const config = {
    normal: {
      color: "bg-emerald-500",
      text: "text-emerald-700",
      icon: CheckCircle2,
      defaultLabel: "Normal",
    },
    online: {
      color: "bg-emerald-500",
      text: "text-emerald-700",
      icon: CheckCircle2,
      defaultLabel: "Online",
    },
    warning: {
      color: "bg-amber-500",
      text: "text-amber-700",
      icon: AlertTriangle,
      defaultLabel: "Warning",
    },
    critical: {
      color: "bg-red-500",
      text: "text-red-700",
      icon: AlertOctagon,
      defaultLabel: "Critical",
    },
    info: {
      color: "bg-blue-500",
      text: "text-blue-700",
      icon: Info,
      defaultLabel: "Information",
    },
    offline: {
      color: "bg-gray-400",
      text: "text-gray-600",
      icon: WifiOff,
      defaultLabel: "Offline",
    },
    inactive: {
      color: "bg-gray-400",
      text: "text-gray-500",
      icon: PowerOff,
      defaultLabel: "Inactive",
    },
  };

  const current = config[status] || config.normal;
  const IconComponent = current.icon;
  const displayLabel = label || current.defaultLabel;

  return (
    <div className={cn("inline-flex items-center gap-1.5", className)}>
      <span className={cn("rounded-full shrink-0", current.color, size === "sm" ? "w-2 h-2" : "w-2.5 h-2.5")} />
      {showIcon && <IconComponent className={cn("shrink-0", current.text, size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4")} />}
      <span className={cn("font-medium", current.text, size === "sm" ? "text-xs" : "text-sm")}>
        {displayLabel}
      </span>
    </div>
  );
};
