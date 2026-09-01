"use client";

import React, { useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { KpiCard } from "@/components/ui/kpi-card";
import { ChartCard } from "@/components/ui/chart-card";
import { BuildingCard } from "@/components/ui/building-card";
import { AlertRow } from "@/components/ui/alert-row";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LiveTelemetryCard } from "@/components/ui/live-telemetry-card";
import { useTelemetry } from "@/lib/use-telemetry";
import { formatDate } from "@/lib/utils";
import {
  MOCK_BUILDINGS,
  MOCK_ALERTS,
  MOCK_HOURLY_TREND,
} from "@/data/mock-data";
import { Droplets, Activity, Cpu, AlertTriangle, Filter, Download, Database, CheckCircle2, Radio } from "lucide-react";

export default function WaterPage() {
  const [selectedCampus, setSelectedCampus] = useState("cmp_main_01");
  const [selectedBuilding, setSelectedBuilding] = useState("all");
  const [selectedTimeRange, setSelectedTimeRange] = useState("today");

  // Fetch live telemetry from Supabase
  const { data: telemetryData, metrics, isLoading, isLiveReceiving, refetch } = useTelemetry(4000);

  const filteredBuildings = selectedBuilding === "all"
    ? MOCK_BUILDINGS
    : MOCK_BUILDINGS.filter((b) => b.id === selectedBuilding);

  const history = telemetryData?.history || [];

  // Prepare chart points from actual Supabase telemetry
  const chartPoints = history.length > 0
    ? history.slice(0, 16).reverse().map((rec) => ({
        id: rec.id,
        flowRateLpm: Number(rec.flow_rate_lpm) || 0,
        totalVolumeLiters: Number(rec.total_volume_liters) || 0,
        pulseCount: rec.pulse_count,
        timestamp: rec.timestamp ? new Date(rec.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : `#${rec.id}`,
      }))
    : MOCK_HOURLY_TREND;

  return (
    <AppShell>
      {/* Breadcrumb Context */}
      <Breadcrumb
        items={[
          { label: "Eco Flux University" },
          { label: "Water Intelligence", href: "/water" },
          { label: "Flow & Consumption" },
        ]}
      />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-2xl font-bold tracking-tight text-gray-900">Water Resource & Telemetry Management</h2>
            <Badge variant="normal" icon={<Droplets className="w-3.5 h-3.5" />}>
              Live Telemetry Active
            </Badge>
          </div>
          <p className="text-sm text-gray-500">
            Real-time telemetry stream from physical <strong className="font-medium text-gray-800">{metrics.deviceUid}</strong> and YF-S201 flow sensor.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" icon={<Download className="w-4 h-4" />}>
            Export Telemetry Log
          </Button>
        </div>
      </div>

      {/* Live Physical ESP32 Hardware Status Card */}
      <LiveTelemetryCard
        deviceUid={metrics.deviceUid}
        sensorType={metrics.sensorType}
        flowRateLpm={metrics.flowRateLpm}
        totalVolumeLiters={metrics.totalVolumeLiters}
        pulseCount={metrics.pulseCount}
        recordId={metrics.recordId}
        timestamp={metrics.latestTimestamp}
        lastSeenAt={metrics.lastSeenAt}
        isOnline={metrics.isOnline}
        isLiveReceiving={isLiveReceiving}
        isLoading={isLoading}
        onRefresh={refetch}
      />

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex flex-wrap items-center gap-4 text-xs">
        <div className="flex items-center gap-1.5 font-semibold text-gray-700">
          <Filter className="w-4 h-4 text-gray-400" />
          <span>Filters:</span>
        </div>

        <div className="w-48">
          <Select
            options={[
              { value: "cmp_main_01", label: "Main Campus" },
              { value: "cmp_north_02", label: "North Campus" },
            ]}
            value={selectedCampus}
            onChange={(e) => setSelectedCampus(e.target.value)}
          />
        </div>

        <div className="w-48">
          <Select
            options={[
              { value: "all", label: "All Buildings" },
              ...MOCK_BUILDINGS.map((b) => ({ value: b.id, label: b.name })),
            ]}
            value={selectedBuilding}
            onChange={(e) => setSelectedBuilding(e.target.value)}
          />
        </div>

        <div className="w-40">
          <Select
            options={[
              { value: "today", label: "Today (Live Stream)" },
              { value: "yesterday", label: "Yesterday" },
              { value: "last7days", label: "Last 7 Days" },
              { value: "month", label: "This Month" },
            ]}
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value)}
          />
        </div>
      </div>

      {/* KPI Row (Powered by Real Supabase Data) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Current Flow Rate"
          value={metrics.flowRateLpm.toFixed(2)}
          unit="L/min"
          trend={{
            value: metrics.flowRateLpm > 0 ? "Active Flow" : "Zero Flow",
            direction: metrics.flowRateLpm > 0 ? "up" : "neutral",
            label: "YF-S201",
            isPositive: true,
          }}
          icon={<Activity className="w-5 h-5 text-emerald-600" />}
          supportingText="Calibrated 7.5 pulses/sec/LPM"
        />

        <KpiCard
          title="Total Measured Volume"
          value={metrics.totalVolumeLiters > 0 ? metrics.totalVolumeLiters.toFixed(2) : "0.00"}
          unit="Liters"
          trend={{ value: `${metrics.pulseCount.toLocaleString()} pulses`, direction: "up", label: "Hall Transducer", isPositive: true }}
          icon={<Droplets className="w-5 h-5 text-teal-600" />}
          supportingText="Cumulative pulse counter"
        />

        <KpiCard
          title="Water Nodes Online"
          value={metrics.isOnline ? "1 / 1 Online" : "1 Registered"}
          unit="Active"
          trend={{
            value: metrics.isOnline ? "Healthy Heartbeat" : "Standby",
            direction: metrics.isOnline ? "up" : "neutral",
          }}
          icon={<Cpu className="w-5 h-5 text-emerald-600" />}
          supportingText={metrics.recordId ? `Latest DB Record #${metrics.recordId}` : "60s Offline Threshold"}
        />

        <KpiCard
          title="Continuous Flow Alerts"
          value={MOCK_ALERTS.length}
          unit="Events"
          badge={<Badge variant="critical">1 High Severity</Badge>}
          icon={<AlertTriangle className="w-5 h-5 text-red-600" />}
          supportingText="Off-Peak Rules Triggered"
        />
      </div>

      {/* Live Flow Chart & Historical Section */}
      <ChartCard
        title="Live Water Flow Rate (L/min) & Supabase Telemetry Stream"
        subtitle="Real-time telemetry stream recorded by physical ESP32 and stored in public.telemetry."
        action={
          <div className="flex items-center gap-2">
            <span className="text-xs text-emerald-800 font-semibold bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
              Live Ingestion Active (5s)
            </span>
          </div>
        }
      >
        <div className="w-full space-y-4">
          <div className="h-56 w-full relative flex items-end justify-between gap-1.5 pt-6 px-2">
            {/* Threshold Line */}
            <div className="absolute inset-x-0 top-10 border-b-2 border-dashed border-red-400 text-[10px] text-red-600 font-semibold px-2 z-0 flex justify-between">
              <span>Critical Flow Threshold (8.0 L/min)</span>
              <span>Rule Evaluation Window: 5 min</span>
            </div>

            {/* Line Graph Render */}
            {chartPoints.map((point: any, idx: number) => {
              const flow = Number(point.flowRateLpm) || 0;
              const maxScale = 10;
              const heightPct = Math.min(100, Math.max(10, (flow / maxScale) * 100));
              const isThresholdExceeded = flow > 5.0;

              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1 z-10 group relative">
                  {/* Hover tooltip */}
                  <div className="opacity-0 group-hover:opacity-100 absolute -top-10 bg-gray-900 text-white text-[10px] py-1 px-2 rounded-md whitespace-nowrap transition-opacity pointer-events-none z-20 font-mono">
                    {point.timestamp}: {flow.toFixed(2)} L/min
                    {point.pulseCount !== undefined ? ` • ${point.pulseCount} pulses` : ""}
                  </div>

                  <div
                    style={{ height: `${heightPct}%` }}
                    className={`w-full rounded-t-sm transition-all duration-300 ${
                      isThresholdExceeded ? "bg-amber-500 shadow-xs" : "bg-[#0B6B4F]"
                    }`}
                  />
                  <span className="text-[9px] text-gray-400 font-mono truncate max-w-[42px] mt-1">{point.timestamp}</span>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-100">
            <span>Primary Sensor: YF-S201 Flow Sensor (Calibration Factor: 7.5 Hz/LPM)</span>
            <span>Total Measured Volume: {metrics.totalVolumeLiters.toFixed(2)} Liters ({metrics.pulseCount.toLocaleString()} pulses)</span>
          </div>
        </div>
      </ChartCard>

      {/* Live Telemetry Database Stream Log Table */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-gray-100">
          <div>
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Database className="w-4 h-4 text-[#0B6B4F]" />
              <span>Confirmed Telemetry Records (`public.telemetry`)</span>
            </h3>
            <p className="text-xs text-gray-500">
              Live records persisted to Supabase database from physical ESP32 node.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 font-mono">
              Showing last {history.length} records
            </span>
            <Button size="sm" variant="outline" onClick={refetch}>
              Refresh
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/70 text-gray-600 font-semibold">
                <th className="py-2.5 px-3">Record ID</th>
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3 text-right">Flow Rate</th>
                <th className="py-2.5 px-3 text-right">Total Volume</th>
                <th className="py-2.5 px-3 text-right">Pulse Count</th>
                <th className="py-2.5 px-3">Ingested At</th>
                <th className="py-2.5 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-mono">
              {history.length > 0 ? (
                history.slice(0, 10).map((row, idx) => (
                  <tr key={row.id} className={idx === 0 ? "bg-emerald-50/40" : "hover:bg-gray-50/50"}>
                    <td className="py-2.5 px-3 font-bold text-gray-900">#{row.id}</td>
                    <td className="py-2.5 px-3 text-gray-600 font-sans">{formatDate(row.timestamp)}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-[#0B6B4F]">
                      {Number(row.flow_rate_lpm).toFixed(2)} L/min
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
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                        <CheckCircle2 className="w-3 h-3" />
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-gray-400 font-sans">
                    No telemetry records stored yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Building Status Grid */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Monitored Building Water Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBuildings.map((bld) => (
            <BuildingCard key={bld.id} building={bld} />
          ))}
        </div>
      </div>

      {/* Active Alerts in Water Scope */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Active Water Anomaly Events</h3>
        <div className="space-y-3">
          {MOCK_ALERTS.map((alert) => (
            <AlertRow key={alert.id} alert={alert} />
          ))}
        </div>
      </div>
    </AppShell>
  );
}
