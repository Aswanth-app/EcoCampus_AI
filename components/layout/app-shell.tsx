"use client";

import React, { useState } from "react";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";

export interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F8FAF9] flex flex-col font-sans antialiased">
      {/* Sidebar Navigation */}
      <Sidebar
        isMobileOpen={isMobileOpen}
        onMobileClose={() => setIsMobileOpen(false)}
      />

      {/* Main App Container */}
      <div className="lg:pl-64 flex flex-col flex-1 transition-all duration-300">
        <Topbar onMobileToggle={() => setIsMobileOpen(true)} />

        {/* Page Main Content Area */}
        <main className="flex-1 p-4 md:p-6 max-w-7xl w-full mx-auto space-y-6">
          {children}
        </main>
      </div>
    </div>
  );
};
