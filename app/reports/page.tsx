"use client";

import React, { useState, useMemo } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { ChartCard } from "@/components/ui/chart-card";
import { KpiCard } from "@/components/ui/kpi-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTelemetry } from "@/lib/use-telemetry";
import { formatDate } from "@/lib/utils";
import {
  FileText,
  Download,
  Calendar,
  Activity,
  Droplets,
  AlertTriangle,
  Database,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  Radio,
  BarChart3,
  PieChart,
} from "lucide-react";

export default function ReportsPage() {
  const [reportCategory, setReportCategory] = useState<"summary" | "hourly" | "daily" | "anomalies">("summary");
  
  // Real telemetry feed from Supabase
  const { data: telemetryData, metrics, isLoading, refetch } = useTelemetry(4000);
  const history = telemetryData?.history || [];

  // Compute real statistics from stored Supabase telemetry
  const stats = useMemo(() => {
    if (!history || history.length === 0) {
      return {
        totalConsumedLiters: metrics.lastRecordedVolumeLiters || 0,
        currentFlowLpm: metrics.isOnline && metrics.flowRateLpm !== null ? metrics.flowRateLpm : metrics.lastRecordedFlowLpm || 0,
        averageFlowLpm: 0,
        peakFlowLpm: 0,
        anomaliesCount: 0,
        suspectedLeakageCount: 0,
        avoidableWaterLiters: 0,
        distribution: { normal: 0, low: 0, medium: 0, critical: 0 },
        hourlyBreakdown: [] as { hour: string; count: number; avgFlow: number; volume: number }[],
        dailyBreakdown: [] as { date: string; count: number; maxFlow: number; volume: number }[],
      };
    }

    const flowValues = history.map((r) => Number(r.flow_rate_lpm) || 0);
    const totalFlow = flowValues.reduce((a, b) => a + b, 0);
    const avgFlow = Number((totalFlow / history.length).toFixed(2));
    const peakFlow = Number(Math.max(...flowValues).toFixed(2));

    // Distribution classification based on prompt rules
    let normalCount = 0;
    let lowCount = 0;
    let mediumCount = 0;
    let criticalCount = 0;
    let leakageCount = 0;
    let avoidableLoss = 0;

    history.forEach((rec) => {
      const flow = Number(rec.flow_rate_lpm) || 0;
      if (flow > 14.0) {
        criticalCount++;
        leakageCount++;
        avoidableLoss += (flow - 5.0) * (5 / 60); // 5 sec interval loss
      } else if (flow > 8.0) {
        mediumCount++;
        leakageCount++;
        avoidableLoss += (flow - 5.0) * (5 / 60);
      } else if (flow > 5.0) {
        lowCount++;
      } else {
        normalCount++;
      }
    });

    const anomaliesCount = lowCount + mediumCount + criticalCount;
    const totalConsumed = metrics.lastRecordedVolumeLiters > 0
      ? metrics.lastRecordedVolumeLiters
      : Number(history[0]?.total_volume_liters) || 0;

    // Hourly aggregation
    const hourlyMap: Record<number, { count: number; flowSum: number; maxVol: number }> = {};
    history.forEach((rec) => {
      const date = new Date(rec.timestamp);
      const h = isNaN(date.getTime()) ? new Date().getHours() : date.getHours();
      if (!hourlyMap[h]) hourlyMap[h] = { count: 0, flowSum: 0, maxVol: 0 };
      hourlyMap[h].count++;
      hourlyMap[h].flowSum += Number(rec.flow_rate_lpm) || 0;
      hourlyMap[h].maxVol = Math.max(hourlyMap[h].maxVol, Number(rec.total_volume_liters) || 0);
    });

    const hourlyBreakdown = Object.keys(hourlyMap)
      .map(Number)
      .sort((a, b) => a - b)
      .map((h) => ({
        hour: `${String(h).padStart(2, "0")}:00`,
        count: hourlyMap[h].count,
        avgFlow: Number((hourlyMap[h].flowSum / hourlyMap[h].count).toFixed(2)),
        volume: Number(hourlyMap[h].maxVol.toFixed(2)),
      }));

    // Daily aggregation
    const dailyMap: Record<string, { count: number; maxFlow: number; volume: number }> = {};
    history.forEach((rec) => {
      const dateStr = rec.timestamp ? new Date(rec.timestamp).toISOString().split("T")[0] : "Recent";
      if (!dailyMap[dateStr]) dailyMap[dateStr] = { count: 0, maxFlow: 0, volume: 0 };
      dailyMap[dateStr].count++;
      dailyMap[dateStr].maxFlow = Math.max(dailyMap[dateStr].maxFlow, Number(rec.flow_rate_lpm) || 0);
      dailyMap[dateStr].volume = Math.max(dailyMap[dateStr].volume, Number(rec.total_volume_liters) || 0);
    });

    const dailyBreakdown = Object.entries(dailyMap).map(([date, val]) => ({
      date,
      count: val.count,
      maxFlow: Number(val.maxFlow.toFixed(2)),
      volume: Number(val.volume.toFixed(2)),
    }));

    return {
      totalConsumedLiters: totalConsumed,
      currentFlowLpm: metrics.isOnline && metrics.flowRateLpm !== null ? metrics.flowRateLpm : metrics.lastRecordedFlowLpm,
      averageFlowLpm: avgFlow,
      peakFlowLpm: peakFlow,
      anomaliesCount,
      suspectedLeakageCount: leakageCount,
      avoidableWaterLiters: Number(avoidableLoss.toFixed(2)),
      distribution: {
        normal: normalCount,
        low: lowCount,
        medium: mediumCount,
        critical: criticalCount,
      },
      hourlyBreakdown,
      dailyBreakdown,
    };
  }, [history, metrics]);

  // Real CSV Export Trigger
  const handleExportCSV = () => {
    if (!history || history.length === 0) {
      alert("No telemetry records available to export.");
      return;
    }

    const headers = ["ID", "Sensor ID", "Timestamp", "Flow Rate (L/min)", "Total Volume (Liters)", "Pulse Count", "Status", "Received At"];
    const rows = history.map((r) => [
      r.id,
      r.sensor_id,
      `"${r.timestamp}"`,
      r.flow_rate_lpm,
      r.total_volume_liters,
      r.pulse_count,
      r.status,
      `"${r.received_at}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `ecocampus_telemetry_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalRecords = history.length;

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
            <h2 className="text-2xl font-bold tracking-tight text-gray-900">Resource Consumption & Sustainability Report</h2>
            <Badge variant="normal" icon={<FileText className="w-3.5 h-3.5" />}>
              Supabase Telemetry Source
            </Badge>
          </div>
          <p className="text-sm text-gray-500">
            Real-time statistical synthesis of ESP32 water flow records stored in <code className="font-mono text-emerald-800">public.telemetry</code>.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="primary" size="sm" icon={<Download className="w-4 h-4" />} onClick={handleExportCSV}>
            Export Telemetry CSV ({totalRecords} Records)
          </Button>
          <Button variant="outline" size="sm" onClick={refetch}>
            Refresh
          </Button>
        </div>
      </div>

      {/* KPI Cards Row (Computed from Real Supabase Telemetry) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Total Water Consumed"
          value={stats.totalConsumedLiters.toFixed(2)}
          unit="Liters"
          trend={{
            value: metrics.lastRecordedPulses > 0 ? `${metrics.lastRecordedPulses.toLocaleString()} pulses` : "0 pulses",
            direction: "up",
            label: metrics.isOnline ? "Live stream" : "Stored in DB",
            isPositive: true,
          }}
          icon={<Droplets className="w-5 h-5 text-emerald-600" />}
          supportingText={metrics.lastRecordedTimestamp ? `Last recorded: ${formatDate(metrics.lastRecordedTimestamp)}` : "Awaiting telemetry"}
        />

        <KpiCard
          title="Average Flow Rate"
          value={stats.averageFlowLpm.toFixed(2)}
          unit="L/min"
          trend={{
            value: `Peak: ${stats.peakFlowLpm.toFixed(2)} L/min`,
            direction: "neutral",
            label: "Over stored window",
          }}
          icon={<Activity className="w-5 h-5 text-teal-600" />}
          supportingText={`Evaluated across ${totalRecords} historical records`}
        />

        <KpiCard
          title="Suspected Leakage Events"
          value={stats.suspectedLeakageCount}
          unit="Events"
          badge={
            stats.suspectedLeakageCount > 0 ? (
              <Badge variant="critical">Flagged</Badge>
            ) : (
              <Badge variant="normal">Normal</Badge>
            )
          }
          icon={<AlertTriangle className="w-5 h-5 text-amber-600" />}
          supportingText={`Est. avoidable waste: ${stats.avoidableWaterLiters} L`}
        />

        <KpiCard
          title="Telemetry Records Ingested"
          value={totalRecords}
          unit="Records"
          trend={{
            value: metrics.isOnline ? "Online (ESP32)" : "Standby (>120s)",
            direction: metrics.isOnline ? "up" : "neutral",
            label: metrics.deviceUid,
          }}
          icon={<Database className="w-5 h-5 text-emerald-600" />}
          supportingText="Persisted in PostgreSQL database"
        />
      </div>

      {/* Anomaly & Risk Level Distribution Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Risk Distribution Breakdown */}
        <ChartCard
          title="Risk Level & Telemetry Distribution"
          subtitle="Classification of stored telemetry readings across standard risk tiers."
        >
          <div className="w-full space-y-4 p-2">
            <div className="space-y-3">
              {/* Normal */}
              <div className="space-y-1 text-xs">
                <div className="flex justify-between font-medium">
                  <span className="text-emerald-800 flex items-center gap-1.5 font-semibold">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    Normal Usage (0–30 Risk, ≤5.0 L/min)
                  </span>
                  <span className="font-mono text-gray-700">
                    {stats.distribution.normal} records ({totalRecords > 0 ? ((stats.distribution.normal / totalRecords) * 100).toFixed(1) : 0}%)
                  </span>
                </div>
                <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${totalRecords > 0 ? (stats.distribution.normal / totalRecords) * 100 : 0}%` }}
                    className="h-full bg-emerald-500 rounded-full transition-all"
                  />
                </div>
              </div>

              {/* Low */}
              <div className="space-y-1 text-xs">
                <div className="flex justify-between font-medium">
                  <span className="text-blue-800 flex items-center gap-1.5 font-semibold">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                    Low Abnormal (31–50 Risk, 5.1–8.0 L/min)
                  </span>
                  <span className="font-mono text-gray-700">
                    {stats.distribution.low} records ({totalRecords > 0 ? ((stats.distribution.low / totalRecords) * 100).toFixed(1) : 0}%)
                  </span>
                </div>
                <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${totalRecords > 0 ? (stats.distribution.low / totalRecords) * 100 : 0}%` }}
                    className="h-full bg-blue-500 rounded-full transition-all"
                  />
                </div>
              </div>

              {/* Medium */}
              <div className="space-y-1 text-xs">
                <div className="flex justify-between font-medium">
                  <span className="text-amber-800 flex items-center gap-1.5 font-semibold">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    Medium Abnormal / Suspected Leak (51–75 Risk, 8.1–14.0 L/min)
                  </span>
                  <span className="font-mono text-gray-700">
                    {stats.distribution.medium} records ({totalRecords > 0 ? ((stats.distribution.medium / totalRecords) * 100).toFixed(1) : 0}%)
                  </span>
                </div>
                <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${totalRecords > 0 ? (stats.distribution.medium / totalRecords) * 100 : 0}%` }}
                    className="h-full bg-amber-500 rounded-full transition-all"
                  />
                </div>
              </div>

              {/* Critical */}
              <div className="space-y-1 text-xs">
                <div className="flex justify-between font-medium">
                  <span className="text-red-800 flex items-center gap-1.5 font-semibold">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-600" />
                    Critical Spike / Pipe Rupture (76–100 Risk, &gt;14.0 L/min)
                  </span>
                  <span className="font-mono text-gray-700">
                    {stats.distribution.critical} records ({totalRecords > 0 ? ((stats.distribution.critical / totalRecords) * 100).toFixed(1) : 0}%)
                  </span>
                </div>
                <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${totalRecords > 0 ? (stats.distribution.critical / totalRecords) * 100 : 0}%` }}
                    className="h-full bg-red-600 rounded-full transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
              <span>Total Assessed Samples: <strong className="text-gray-900 font-mono">{totalRecords}</strong></span>
              <span>Anomalies Flagged: <strong className="text-red-700 font-mono">{stats.anomaliesCount}</strong></span>
            </div>
          </div>
        </ChartCard>

        {/* Sustainability & Avoidable Waste Summary */}
        <ChartCard
          title="Sustainability Audit & Avoidable Waste"
          subtitle="Quantified water conservation metrics calculated from actual sensor deviations."
        >
          <div className="w-full space-y-4 p-2 text-xs">
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
              <span className="text-emerald-800 font-semibold block">Total Estimated Avoidable Water Loss</span>
              <span className="text-3xl font-bold text-emerald-950 block mt-1 font-mono">
                {stats.avoidableWaterLiters.toFixed(2)} Liters
              </span>
              <p className="text-emerald-800 text-[11px] mt-1">
                Calculated from flow rates exceeding standard institutional baseline.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-gray-700">
              <div className="p-3 rounded-lg border border-gray-200 bg-gray-50/50">
                <span className="text-gray-500 block">Peak Instantaneous Flow</span>
                <strong className="text-gray-900 text-sm font-mono">{stats.peakFlowLpm.toFixed(2)} L/min</strong>
              </div>
              <div className="p-3 rounded-lg border border-gray-200 bg-gray-50/50">
                <span className="text-gray-500 block">Suspected Leak Incidents</span>
                <strong className="text-gray-900 text-sm font-mono">{stats.suspectedLeakageCount} events</strong>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-gray-50 border border-gray-200 text-[11px] text-gray-600">
              <strong>Audit Policy:</strong> All telemetry records are stored with cryptographic idempotency and remain permanently retrievable regardless of hardware connection status or browser refresh.
            </div>
          </div>
        </ChartCard>
      </div>

      {/* Hourly / Daily Consumption Aggregation */}
      <ChartCard
        title="Hourly Water Usage & Flow Profile"
        subtitle="Aggregated flow rate metrics grouped by hour from stored database records."
      >
        {stats.hourlyBreakdown.length > 0 ? (
          <div className="space-y-3">
            <div className="h-44 w-full flex items-end justify-between gap-2 pt-6 px-2">
              {stats.hourlyBreakdown.map((item, idx) => {
                const maxFlow = Math.max(...stats.hourlyBreakdown.map((h) => h.avgFlow), 1);
                const heightPct = Math.min(100, Math.max(15, (item.avgFlow / maxFlow) * 100));

                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1 group relative">
                    <div className="opacity-0 group-hover:opacity-100 absolute -top-8 bg-gray-900 text-white text-[10px] py-1 px-2 rounded-md whitespace-nowrap transition-opacity pointer-events-none z-20 font-mono">
                      {item.hour}: Avg {item.avgFlow} L/min ({item.count} samples)
                    </div>
                    <div
                      style={{ height: `${heightPct}%` }}
                      className="w-full bg-[#0B6B4F] rounded-t-sm transition-all hover:bg-emerald-600"
                    />
                    <span className="text-[10px] text-gray-400 font-mono truncate">{item.hour}</span>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
              <span>Hourly Average Flow Rate (L/min)</span>
              <span>Cumulative Recorded: {stats.totalConsumedLiters.toFixed(2)} Liters</span>
            </div>
          </div>
        ) : (
          <div className="h-36 w-full flex flex-col items-center justify-center text-center p-4 border border-dashed border-gray-200 rounded-xl bg-gray-50/50">
            <Database className="w-6 h-6 text-gray-400 mb-1" />
            <p className="text-xs text-gray-600 font-medium">Awaiting hourly telemetry samples from ESP32</p>
          </div>
        )}
      </ChartCard>

      {/* Stored Telemetry Records Table */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-gray-100">
          <div>
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Database className="w-4 h-4 text-[#0B6B4F]" />
              <span>Real Telemetry Audit Log (`public.telemetry`)</span>
            </h3>
            <p className="text-xs text-gray-500">
              Permanent historical database records from physical node {metrics.deviceUid}.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 font-mono">
              Total {totalRecords} records stored
            </span>
            <Button size="sm" variant="outline" icon={<Download className="w-3.5 h-3.5" />} onClick={handleExportCSV}>
              Download CSV
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/70 text-gray-600 font-semibold">
                <th className="py-2.5 px-3">ID</th>
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3 text-right">Flow Rate</th>
                <th className="py-2.5 px-3 text-right">Total Volume</th>
                <th className="py-2.5 px-3 text-right">Pulses</th>
                <th className="py-2.5 px-3">Ingested At</th>
                <th className="py-2.5 px-3 text-center">Risk Classification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-mono">
              {history.length > 0 ? (
                history.slice(0, 15).map((row, idx) => {
                  const flow = Number(row.flow_rate_lpm) || 0;
                  const isCritical = flow > 14.0;
                  const isMedium = flow > 8.0 && flow <= 14.0;
                  const isLow = flow > 5.0 && flow <= 8.0;

                  return (
                    <tr key={row.id} className={idx === 0 ? "bg-emerald-50/40" : "hover:bg-gray-50/50"}>
                      <td className="py-2.5 px-3 font-bold text-gray-900">#{row.id}</td>
                      <td className="py-2.5 px-3 text-gray-600 font-sans">{formatDate(row.timestamp)}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-[#0B6B4F]">
                        {flow.toFixed(2)} L/min
                      </td>
                      <td className="py-2.5 px-3 text-right text-gray-800">
                        {Number(row.total_volume_liters).toFixed(2)} L
                      </td>
                      <td className="py-2.5 px-3 text-right text-gray-600">
                        {row.pulse_count.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-gray-500 font-sans text-[11px]">
                        {formatDate(row.received_at)}
                      </td>
                      <td className="py-2.5 px-3 text-center font-sans">
                        {isCritical ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-100 text-red-800">
                            Critical Spike
                          </span>
                        ) : isMedium ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800">
                            Suspected Leak
                          </span>
                        ) : isLow ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-800">
                            Low Abnormal
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                            Normal
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-gray-400 font-sans">
                    No telemetry records stored yet. Send telemetry from ESP32 to populate.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
