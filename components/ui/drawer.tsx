import React, { useEffect } from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { Button } from "./button";

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-gray-900/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
      <div
        className={cn(
          "w-full max-w-md bg-white h-full shadow-2xl border-l border-gray-200 flex flex-col justify-between animate-in slide-in-from-right duration-200"
        )}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close drawer">
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 text-sm text-gray-700">{children}</div>

        {footer && <div className="px-6 py-4 bg-gray-50/80 border-t border-gray-100 flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
};
