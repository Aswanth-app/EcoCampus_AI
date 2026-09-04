import React from "react";
import Link from "next/link";
import { Droplets, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#F8FAF9] flex flex-col items-center justify-center p-6 text-center font-sans antialiased">
      <div className="max-w-md w-full bg-white rounded-2xl border border-gray-200 p-8 shadow-xl space-y-6">
        <div className="w-14 h-14 rounded-2xl bg-[#0B6B4F]/10 border border-[#0B6B4F]/20 flex items-center justify-center mx-auto text-[#0B6B4F]">
          <Droplets className="w-7 h-7 fill-[#0B6B4F]/20" />
        </div>

        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">Page Not Found</h2>
          <p className="text-xs text-gray-500 mt-1">
            The requested EcoCampus intelligence resource or dashboard page does not exist.
          </p>
        </div>

        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#0B6B4F] text-white text-xs font-semibold hover:bg-emerald-800 transition-colors shadow-xs"
        >
          <Home className="w-4 h-4" />
          <span>Return to Dashboard</span>
        </Link>
      </div>
    </div>
  );
}
