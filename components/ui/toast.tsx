import React from "react";
import { cn } from "@/lib/utils";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "info";

export interface ToastProps {
  type?: ToastType;
  title: string;
  message?: string;
  onClose?: () => void;
  className?: string;
}

export const Toast: React.FC<ToastProps> = ({
  type = "info",
  title,
  message,
  onClose,
  className,
}) => {
  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-600" />,
    error: <AlertCircle className="w-5 h-5 text-red-600" />,
    info: <Info className="w-5 h-5 text-blue-600" />,
  };

  const bgStyles = {
    success: "bg-emerald-50 border-emerald-200 text-emerald-950",
    error: "bg-red-50 border-red-200 text-red-950",
    info: "bg-blue-50 border-blue-200 text-blue-950",
  };

  return (
    <div className={cn("flex items-start gap-3 p-4 rounded-xl border shadow-md max-w-sm w-full transition-all", bgStyles[type], className)}>
      <div className="shrink-0 mt-0.5">{icons[type]}</div>
      <div className="flex-1">
        <h5 className="text-sm font-semibold">{title}</h5>
        {message && <p className="text-xs mt-0.5 text-gray-600">{message}</p>}
      </div>
      {onClose && (
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
