import React from "react";
import { cn } from "@/lib/utils";

export interface LoadingSkeletonProps {
  className?: string;
  variant?: "text" | "card" | "kpi" | "table";
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  className,
  variant = "text",
}) => {
  if (variant === "kpi") {
    return (
      <div className={cn("bg-white rounded-xl border border-gray-200 p-5 animate-pulse space-y-3", className)}>
        <div className="h-4 bg-gray-200 rounded-md w-1/3" />
        <div className="h-8 bg-gray-200 rounded-md w-2/3" />
        <div className="h-3 bg-gray-200 rounded-md w-1/2" />
      </div>
    );
  }

  if (variant === "card") {
    return (
      <div className={cn("bg-white rounded-xl border border-gray-200 p-5 animate-pulse space-y-4", className)}>
        <div className="flex items-center justify-between">
          <div className="h-5 bg-gray-200 rounded-md w-1/2" />
          <div className="h-4 bg-gray-200 rounded-full w-12" />
        </div>
        <div className="h-24 bg-gray-100 rounded-lg" />
        <div className="h-4 bg-gray-200 rounded-md w-3/4" />
      </div>
    );
  }

  if (variant === "table") {
    return (
      <div className="w-full bg-white rounded-xl border border-gray-200 p-4 animate-pulse space-y-3">
        <div className="h-8 bg-gray-100 rounded-md w-full" />
        <div className="h-10 bg-gray-50 rounded-md w-full" />
        <div className="h-10 bg-gray-50 rounded-md w-full" />
        <div className="h-10 bg-gray-50 rounded-md w-full" />
      </div>
    );
  }

  return (
    <div className={cn("bg-gray-200 animate-pulse rounded-md h-4 w-full", className)} />
  );
};
