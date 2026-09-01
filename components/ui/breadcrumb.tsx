import React from "react";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ items, className }) => {
  return (
    <nav aria-label="Breadcrumb" className={cn("flex items-center text-xs text-gray-500", className)}>
      <ol className="flex items-center gap-1.5 flex-wrap">
        <li className="flex items-center">
          <Link href="/dashboard" className="hover:text-gray-900 transition-colors flex items-center gap-1">
            <Home className="w-3.5 h-3.5" />
            <span className="sr-only">Home</span>
          </Link>
        </li>

        {items.map((item, idx) => (
          <li key={idx} className="flex items-center gap-1.5">
            <ChevronRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            {item.href ? (
              <Link href={item.href} className="hover:text-gray-900 transition-colors font-medium">
                {item.label}
              </Link>
            ) : (
              <span className="font-semibold text-gray-900">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};
