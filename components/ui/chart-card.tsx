import React from "react";
import { cn } from "@/lib/utils";

export interface ChartCardProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const ChartCard: React.FC<ChartCardProps> = ({
  title,
  subtitle,
  action,
  children,
  className,
}) => {
  return (
    <div className={cn("bg-white rounded-xl border border-gray-200 p-5 shadow-xs flex flex-col justify-between", className)}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-gray-100">
        <div>
          <h3 className="text-base font-semibold text-gray-900">{title}</h3>
          {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      <div className="w-full flex-1 min-h-[220px] flex items-center justify-center">
        {children}
      </div>
    </div>
  );
};
