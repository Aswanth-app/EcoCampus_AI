import React from "react";
import { cn } from "@/lib/utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
}

export const Card: React.FC<CardProps> = ({ className, hover = false, children, ...props }) => {
  return (
    <div
      className={cn(
        "bg-white rounded-xl border border-gray-200 p-5 shadow-xs transition-all",
        hover && "hover:shadow-md hover:border-gray-300",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
