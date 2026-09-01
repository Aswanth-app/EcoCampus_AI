"use client";

import React, { useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { ChartCard } from "@/components/ui/chart-card";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, Calendar, Filter, BarChart3, PieChart } from "lucide-react";
import { MOCK_BUILDINGS } from "@/data/mock-data";
import { formatVolume } from "@/lib/utils";

export default function ReportsPage() {
  const [reportType, setReportType] = useState("daily");

  return (
    <AppShell>
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: "Eco Flux University" },
          { label: "Main Campus" },
          { label: "Executive Reports", href: "/reports" },
        ]}
      />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-2xl font-bold tracking-tight text-gray-900">Resource Consumption Reports</h2>
            <Badge variant="normal" icon={<FileText className="w-3.5 h-3.5" />}>Audit Ready</Badge>
          </div>
          <p className="text-sm text-gray-500">
            Generate and export institutional water efficiency, building comparison, and anomaly history reports.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="primary" size="sm" icon={<Download className="w-4 h-4" />} onClick={() => alert("Report CSV/PDF export initialized for Phase 1 preview.")}>
            Export Selected Report (CSV)
          </Button>
        </div>
      </div>

      {/* Report Selector Controls */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-400" />
          <span className="font-semibold text-gray-700">Report Category:</span>
          <div className="w-56">
            <Select
              options={[
                { value: "daily", label: "Daily Water Consumption Report" },
                { value: "weekly", label: "Weekly Trend Summary" },
                { value: "monthly", label: "Monthly Sustainability Audit" },
                { value: "building", label: "Building-Wise Comparison" },
                { value: "alerts", label: "Historical Alert Log Audit" },
              ]}
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-gray-500 font-medium">Date Range:</span>
          <input type="date" defaultValue="2026-08-01" className="border border-gray-300 rounded-lg p-1.5 text-xs" />
          <span className="text-gray-400">to</span>
          <input type="date" defaultValue="2026-08-21" className="border border-gray-300 rounded-lg p-1.5 text-xs" />
        </div>
      </div>

      {/* Building Comparison Chart Placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          title="Building-Wise Water Usage Comparison (Liters)"
          subtitle="Comparative volume consumption across campus facilities for selected period."
        >
          <div className="w-full space-y-3 p-2">
            {MOCK_BUILDINGS.map((bld) => {
              const maxLiters = 5000;
              const pct = (bld.waterUsageTodayLiters / maxLiters) * 100;

              return (
                <div key={bld.id} className="space-y-1 text-xs">
                  <div className="flex justify-between font-medium">
                    <span className="text-gray-900">{bld.name}</span>
                    <span className="text-gray-700 font-mono">{formatVolume(bld.waterUsageTodayLiters)}</span>
                  </div>
                  <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div style={{ width: `${pct}%` }} className="h-full bg-[#0B6B4F] rounded-full transition-all" />
                  </div>
                </div>
              );
            })}
          </div>
        </ChartCard>

        {/* Sustainability & Efficiency Summary */}
        <ChartCard
          title="Estimated Avoidable Waste vs Baseline"
          subtitle="Rule-based anomaly metrics quantifying off-peak continuous leakage."
        >
          <div className="w-full space-y-4 p-4 text-xs">
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
              <span className="text-emerald-800 font-semibold block">Total Estimated Avoidable Waste Today</span>
              <span className="text-3xl font-bold text-emerald-950 block mt-1">500 Liters</span>
              <p className="text-emerald-800 text-[11px] mt-1">Representing 3.5% of total campus intake.</p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-gray-700">
              <div className="p-3 rounded-lg border border-gray-200">
                <span className="text-gray-500 block">Hostel Block A Leak</span>
                <strong className="text-gray-900 text-sm">320 Liters</strong>
              </div>
              <div className="p-3 rounded-lg border border-gray-200">
                <span className="text-gray-500 block">Kitchen Line Overuse</span>
                <strong className="text-gray-900 text-sm">180 Liters</strong>
              </div>
            </div>
          </div>
        </ChartCard>
      </div>
    </AppShell>
  );
}
