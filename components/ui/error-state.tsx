import React from "react";
import { cn } from "@/lib/utils";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "./button";

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = "Unable to Load Data",
  message = "A temporary error occurred while retrieving information. Please try again.",
  onRetry,
  className,
}) => {
  return (
    <div className={cn("flex flex-col items-center justify-center p-8 text-center bg-red-50/50 rounded-xl border border-red-200 shadow-xs", className)}>
      <div className="p-3 rounded-full bg-red-100 text-red-600 mb-3">
        <AlertCircle className="w-8 h-8" />
      </div>
      <h4 className="text-base font-semibold text-gray-900">{title}</h4>
      <p className="text-xs text-gray-600 max-w-sm mt-1 mb-4">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" icon={<RefreshCw className="w-3.5 h-3.5" />} onClick={onRetry}>
          Try Again
        </Button>
      )}
    </div>
  );
};
