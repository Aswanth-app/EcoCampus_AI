import React from "react";
import { cn } from "@/lib/utils";
import { FolderOpen } from "lucide-react";
import { Button } from "./button";

export interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  actionLabel,
  onAction,
  className,
}) => {
  return (
    <div className={cn("flex flex-col items-center justify-center p-8 text-center bg-white rounded-xl border border-gray-200 shadow-xs", className)}>
      <div className="p-3 rounded-full bg-emerald-50 text-[#0B6B4F] mb-3">
        {icon || <FolderOpen className="w-8 h-8" />}
      </div>
      <h4 className="text-base font-semibold text-gray-900">{title}</h4>
      {description && <p className="text-xs text-gray-500 max-w-sm mt-1 mb-4">{description}</p>}
      {actionLabel && onAction && (
        <Button variant="primary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
