"use client";

import React, { useState } from "react";
import { Search, Bell, Menu, ShieldAlert, ChevronDown, CheckCircle2 } from "lucide-react";
import { MOCK_CAMPUSES, MOCK_ORGANIZATION } from "@/data/mock-data";
import { Badge } from "../ui/badge";

export interface TopbarProps {
  onMobileToggle: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ onMobileToggle }) => {
  const [selectedCampus, setSelectedCampus] = useState(MOCK_CAMPUSES[0].id);
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/90 backdrop-blur-md border-b border-gray-200 px-4 md:px-6 flex items-center justify-between gap-4">
      {/* Mobile Toggle & Search */}
      <div className="flex items-center gap-3 flex-1">
        <button
          onClick={onMobileToggle}
          className="p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 lg:hidden transition-colors"
          aria-label="Open mobile menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Search Input */}
        <div className="relative max-w-xs md:max-w-md w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search buildings, locations, devices (e.g. DEV_ESP32_001)..."
            className="w-full pl-9 pr-4 py-1.5 text-xs md:text-sm bg-gray-50/80 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#0B6B4F] focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* Right Action Bar */}
      <div className="flex items-center gap-3">
        {/* Campus Context Dropdown */}
        <div className="hidden sm:flex items-center gap-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5">
          <span className="text-gray-500 font-medium">Campus:</span>
          <select
            value={selectedCampus}
            onChange={(e) => setSelectedCampus(e.target.value)}
            className="bg-transparent font-semibold text-gray-900 focus:outline-none cursor-pointer pr-1"
          >
            {MOCK_CAMPUSES.map((cmp) => (
              <option key={cmp.id} value={cmp.id}>
                {cmp.name}
              </option>
            ))}
          </select>
        </div>

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white" />
          </button>

          {/* Notification Popover Placeholder */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl border border-gray-200 shadow-xl p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-100">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900">Operational Notifications</h4>
                <Badge variant="critical">2 Active Alerts</Badge>
              </div>

              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded-lg bg-red-50/70 border border-red-100">
                  <div className="flex items-center justify-between text-red-900 font-semibold mb-0.5">
                    <span>Continuous Flow Leak Alert</span>
                    <span className="text-[10px] text-red-600 font-normal">02:14 AM</span>
                  </div>
                  <p className="text-red-800 text-[11px]">Hostel Block A — Ground Floor Restroom (16.8 L/min)</p>
                </div>

                <div className="p-2.5 rounded-lg bg-amber-50/70 border border-amber-100">
                  <div className="flex items-center justify-between text-amber-900 font-semibold mb-0.5">
                    <span>Abnormal Flow Rate</span>
                    <span className="text-[10px] text-amber-600 font-normal">19:45 PM</span>
                  </div>
                  <p className="text-amber-800 text-[11px]">Central Dining Hall — Kitchen Utility Area</p>
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-gray-100 text-center">
                <a href="/alerts" className="text-xs font-semibold text-[#0B6B4F] hover:underline">
                  View All Alerts $\rightarrow$
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
