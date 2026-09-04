"use client";

import React, { useEffect } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error caught by boundary:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#F8FAF9] flex flex-col items-center justify-center p-6 text-center font-sans antialiased">
      <div className="max-w-md w-full bg-white rounded-2xl border border-gray-200 p-8 shadow-xl space-y-6">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-700">
          <AlertTriangle className="w-7 h-7" />
        </div>

        <div>
          <h2 className="text-xl font-bold tracking-tight text-gray-900">Application Notice</h2>
          <p className="text-xs text-gray-500 mt-1">
            EcoCampus AI encountered a temporary loading issue while connecting to services.
          </p>
        </div>

        <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-left font-mono text-[11px] text-gray-600 max-h-24 overflow-y-auto">
          {error?.message || "Operational context is initializing. Please retry."}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => reset()}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#0B6B4F] text-white text-xs font-semibold hover:bg-emerald-800 transition-colors shadow-xs"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Reload Application</span>
          </button>
          <Link
            href="/dashboard"
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gray-100 text-gray-700 text-xs font-semibold hover:bg-gray-200 transition-colors"
          >
            <Home className="w-4 h-4" />
            <span>Go to Dashboard</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
