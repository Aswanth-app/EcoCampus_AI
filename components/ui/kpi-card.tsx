import React from "react";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export interface KpiCardProps {
  title: string;
  value: string | number;
  unit?: string;
  trend?: {
    value: string;
    direction: "up" | "down" | "neutral";
    label?: string;
    isPositive?: boolean;
  };
  icon?: React.ReactNode;
  supportingText?: string;
  badge?: React.ReactNode;
  className?: string;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  unit,
  trend,
  icon,
  supportingText,
  badge,
  className,
}) => {
  return (
    <div className={cn("bg-white rounded-xl border border-gray-200 p-5 shadow-xs flex flex-col justify-between", className)}>
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">{title}</span>
        <div className="flex items-center gap-1.5">
          {badge}
          {icon && <div className="p-2 rounded-lg bg-emerald-50 text-[#0B6B4F]">{icon}</div>}
        </div>
      </div>

      <div className="flex items-baseline gap-2 mb-2">
        <span className="text-3xl font-bold tracking-tight text-gray-900">{value}</span>
        {unit && <span className="text-sm font-medium text-gray-500">{unit}</span>}
      </div>

      {(trend || supportingText) && (
        <div className="flex items-center justify-between text-xs pt-2 border-t border-gray-100">
          {trend && (
            <div className="flex items-center gap-1">
              {trend.direction === "up" && (
                <TrendingUp className={cn("w-3.5 h-3.5", trend.isPositive ? "text-emerald-600" : "text-red-600")} />
              )}
              {trend.direction === "down" && (
                <TrendingDown className={cn("w-3.5 h-3.5", trend.isPositive ? "text-emerald-600" : "text-red-600")} />
              )}
              {trend.direction === "neutral" && <Minus className="w-3.5 h-3.5 text-gray-400" />}
              <span
                className={cn(
                  "font-medium",
                  trend.direction === "neutral"
                    ? "text-gray-600"
                    : trend.isPositive
                    ? "text-emerald-700"
                    : "text-red-700"
                )}
              >
                {trend.value}
              </span>
              {trend.label && <span className="text-gray-500">{trend.label}</span>}
            </div>
          )}
          {supportingText && <span className="text-gray-500 font-normal">{supportingText}</span>}
        </div>
      )}
    </div>
  );
};
