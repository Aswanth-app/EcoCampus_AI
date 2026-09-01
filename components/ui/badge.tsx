import React from "react";
import { cn } from "@/lib/utils";

export type BadgeVariant =
  | "normal"
  | "warning"
  | "critical"
  | "info"
  | "offline"
  | "neutral";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  icon?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = "neutral",
  icon,
  children,
  ...props
}) => {
  const variantStyles = {
    normal: "bg-emerald-50 text-emerald-800 border-emerald-200",
    warning: "bg-amber-50 text-amber-800 border-amber-200",
    critical: "bg-red-50 text-red-800 border-red-200",
    info: "bg-blue-50 text-blue-800 border-blue-200",
    offline: "bg-gray-100 text-gray-700 border-gray-200",
    neutral: "bg-gray-50 text-gray-700 border-gray-200",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border transition-colors",
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  );
};
