"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Droplets,
  Sparkles,
  AlertTriangle,
  MapPin,
  Cpu,
  FileText,
  Settings,
  HelpCircle,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Building2,
} from "lucide-react";
import { MOCK_CURRENT_USER, MOCK_ORGANIZATION } from "@/data/mock-data";

export interface SidebarProps {
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isMobileOpen, onMobileClose }) => {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const mainNav = [
    { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
    { label: "Water", href: "/water", icon: Droplets, badge: "MVP" },
    { label: "Insights", href: "/insights", icon: Sparkles },
    { label: "Alerts", href: "/alerts", icon: AlertTriangle, badge: "2" },
    { label: "Locations", href: "/locations", icon: MapPin },
    { label: "Devices", href: "/devices", icon: Cpu },
    { label: "Reports", href: "/reports", icon: FileText },
  ];

  const bottomNav = [
    { label: "Settings", href: "/settings", icon: Settings },
    { label: "Help & Docs", href: "#", icon: HelpCircle },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-900/50 backdrop-blur-xs lg:hidden"
          onClick={onMobileClose}
        />
      )}

      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 z-40 bg-white border-r border-gray-200 flex flex-col justify-between transition-all duration-300 ease-in-out",
          isCollapsed ? "w-20" : "w-64",
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Header Branding */}
        <div>
          <div className="h-16 px-4 flex items-center justify-between border-b border-gray-100">
            <Link href="/dashboard" className="flex items-center gap-3 overflow-hidden">
              <div className="w-10 h-10 rounded-xl bg-[#0B6B4F] flex items-center justify-center text-white shrink-0 shadow-xs">
                <Droplets className="w-6 h-6 fill-emerald-100/30" />
              </div>
              {!isCollapsed && (
                <div className="truncate">
                  <h1 className="text-base font-bold tracking-tight text-gray-900 flex items-center gap-1.5">
                    EcoCampus <span className="text-[#0B6B4F]">AI</span>
                  </h1>
                  <p className="text-[10px] text-gray-500 font-medium truncate">Resource Intelligence</p>
                </div>
              )}
            </Link>
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden lg:flex p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>

          {/* Org Selector Badge */}
          {!isCollapsed && (
            <div className="mx-3 my-3 p-2.5 rounded-lg bg-gray-50 border border-gray-100 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#0B6B4F] shrink-0" />
              <div className="truncate text-xs">
                <p className="font-semibold text-gray-900 truncate">{MOCK_ORGANIZATION.name}</p>
                <p className="text-gray-500 text-[11px] truncate">Main Campus Context</p>
              </div>
            </div>
          )}

          {/* Primary Nav List */}
          <nav className="p-3 space-y-1">
            {mainNav.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onMobileClose}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group relative",
                    isActive
                      ? "bg-emerald-50 text-[#0B6B4F] font-semibold"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  )}
                >
                  <Icon className={cn("w-5 h-5 shrink-0 transition-colors", isActive ? "text-[#0B6B4F]" : "text-gray-400 group-hover:text-gray-600")} />
                  {!isCollapsed && <span className="truncate">{item.label}</span>}
                  {!isCollapsed && item.badge && (
                    <span
                      className={cn(
                        "ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-md",
                        item.badge === "MVP"
                          ? "bg-emerald-100 text-[#0B6B4F]"
                          : "bg-red-100 text-red-700"
                      )}
                    >
                      {item.badge}
                    </span>
                  )}
                  {isActive && (
                    <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-[#0B6B4F] rounded-r-full" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section */}
        <div className="p-3 border-t border-gray-100 space-y-1">
          {bottomNav.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                  isActive && "bg-gray-100 text-gray-900 font-semibold"
                )}
              >
                <Icon className="w-5 h-5 shrink-0 text-gray-400" />
                {!isCollapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}

          {/* User Profile */}
          <div className="pt-3 mt-2 border-t border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-9 h-9 rounded-full bg-emerald-700 text-white font-semibold text-xs flex items-center justify-center shrink-0">
                AV
              </div>
              {!isCollapsed && (
                <div className="truncate text-xs">
                  <p className="font-semibold text-gray-900 truncate">{MOCK_CURRENT_USER.name}</p>
                  <p className="text-gray-500 text-[11px] capitalize truncate">Facility Manager</p>
                </div>
              )}
            </div>
            {!isCollapsed && (
              <Link href="/login" className="p-1.5 text-gray-400 hover:text-red-600 transition-colors" title="Sign Out">
                <LogOut className="w-4 h-4" />
              </Link>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
