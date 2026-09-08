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
import { useWaterAi } from "@/lib/use-water-ai";
import { formatDate } from "@/lib/utils";
import {
  MOCK_BUILDINGS,
  MOCK_ALERTS,
} from "@/data/mock-data";
import { Droplets, Activity, Cpu, AlertTriangle, Filter, Download, Database, CheckCircle2, Radio, Sparkles, ShieldAlert, AlertCircle, Layers, Award } from "lucide-react";
import { Building } from "@/types";

export default function WaterPage() {
  const [selectedCampus, setSelectedCampus] = useState("cmp_main_01");
  const [selectedBuilding, setSelectedBuilding] = useState("all");
  const [selectedTimeRange, setSelectedTimeRange] = useState("today");
  const [showHistoricalArchive, setShowHistoricalArchive] = useState(false);

  // Fetch live telemetry from Supabase
  const { data: telemetryData, metrics, isLoading, isLiveReceiving, refetch } = useTelemetry(4000);

  // Live Water Intelligence & Anomaly Engine Hook
  const { analysisResult, riskScore, riskLevel, isAnomaly, liveAlerts, baseline, isOnline } = useWaterAi(6000, telemetryData, metrics.isOnline);

  // Dynamically map buildings: Bind Hostel Block A to physical ESP32 node
  const mappedBuildings: Building[] = MOCK_BUILDINGS.map((bld) => {
    if (bld.id === "bld_hostel_a") {
      return {
        ...bld,
        currentFlowLpm: isOnline && metrics.flowRateLpm !== null ? metrics.flowRateLpm : 0,
        waterUsageTodayLiters: metrics.lastRecordedVolumeLiters > 0 ? metrics.lastRecordedVolumeLiters : bld.waterUsageTodayLiters,
        status: isOnline ? (isAnomaly ? "critical" : "normal") : "offline",
        devicesOnlineCount: isOnline ? 1 : 0,
        devicesCount: 1,
        activeAlertsCount: liveAlerts.length,
        isLiveNode: true,
        simulationLabel: undefined,
      };
    }
    return {
      ...bld,
      isLiveNode: false,
      simulationLabel: "Simulated Facility",
    };
  });

  const filteredBuildings = selectedBuilding === "all"
    ? mappedBuildings
    : mappedBuildings.filter((b) => b.id === selectedBuilding);

  const history = telemetryData?.history || [];

  // Prepare chart points exclusively from actual Supabase telemetry
  const chartPoints = history.length > 0
    ? history.slice(0, 16).reverse().map((rec) => ({
        id: rec.id,
        flowRateLpm: Number(rec.flow_rate_lpm) || 0,
        totalVolumeLiters: Number(rec.total_volume_liters) || 0,
        pulseCount: rec.pulse_count,
        timestamp: rec.timestamp ? new Date(rec.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : `#${rec.id}`,
      }))
    : [];

  // Real CSV Export Trigger for Water Page
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
    link.setAttribute("download", `ecocampus_water_telemetry_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
            {isOnline ? (
              <Badge variant="normal" icon={<Radio className="w-3.5 h-3.5 animate-pulse text-emerald-600" />}>
                Live Telemetry Active
              </Badge>
            ) : (
              <Badge variant="neutral" icon={<Activity className="w-3.5 h-3.5 text-gray-500" />}>
                Node in Standby / Offline
              </Badge>
            )}
          </div>
          <p className="text-sm text-gray-500">
            {isOnline
              ? `Real-time telemetry stream from physical ${metrics.deviceUid} and YF-S201 flow sensor.`
              : `Physical hardware ${metrics.deviceUid} is in standby (>120s without heartbeat).`}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            className="border-emerald-600 text-[#0B6B4F] hover:bg-emerald-50"
            icon={<Award className="w-4 h-4 text-emerald-600" />}
            onClick={() => (window.location.href = "/round2")}
          >
            Resource Intelligence
          </Button>
          <Button variant="outline" size="sm" icon={<Download className="w-4 h-4" />} onClick={handleExportCSV}>
            Export Telemetry Log ({history.length})
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
        lastRecordedFlowLpm={metrics.lastRecordedFlowLpm}
        lastRecordedVolumeLiters={metrics.lastRecordedVolumeLiters}
        lastRecordedPulses={metrics.lastRecordedPulses}
        recordId={metrics.recordId}
        timestamp={metrics.latestTimestamp}
        lastSeenAt={metrics.lastSeenAt}
        isOnline={metrics.isOnline}
        isLiveReceiving={isLiveReceiving}
        isLoading={isLoading}
        totalRecordsCount={metrics.totalRecordsCount}
        onRefresh={refetch}
      />

      {/* AI Water Intelligence & Anomaly Health Banner */}
      <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs transition-all ${
        !isOnline
          ? "bg-gray-50 border-gray-300 text-gray-800"
          : riskLevel === "CRITICAL"
          ? "bg-red-50/90 border-red-300 text-red-950"
          : riskLevel === "HIGH"
          ? "bg-amber-50/90 border-amber-300 text-amber-950"
          : isAnomaly
          ? "bg-blue-50/90 border-blue-200 text-blue-950"
          : "bg-emerald-50/60 border-emerald-200 text-emerald-950"
      }`}>
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${
            !isOnline
              ? "bg-gray-200 text-gray-700"
              : riskLevel === "CRITICAL" || riskLevel === "HIGH"
              ? "bg-red-500/20 text-red-700"
              : "bg-emerald-500/20 text-emerald-700"
          }`}>
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-sm tracking-tight">AI Water Intelligence Engine</span>
              <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                !isOnline
                  ? "bg-gray-600 text-white"
                  : riskLevel === "CRITICAL"
                  ? "bg-red-600 text-white"
                  : riskLevel === "HIGH"
                  ? "bg-amber-500 text-white"
                  : riskLevel === "MEDIUM"
                  ? "bg-blue-600 text-white"
                  : "bg-emerald-600 text-white"
              }`}>
                {!isOnline ? "STATUS: STANDBY (OFFLINE)" : `RISK: ${riskLevel} (${riskScore}/100)`}
              </span>
              <span className="text-[10px] text-gray-500">
                Baseline: {baseline?.isLearned ? "Learned Gaussian Profile" : "Cold-Start Baseline Profile"}
              </span>
            </div>
            <p className="mt-0.5 text-gray-600">
              {!isOnline
                ? "Physical node DEV_ESP32_001 has had no heartbeat in >120s. Anomaly engine is on standby (zero live alerts generated)."
                : analysisResult?.primaryReason || "Telemetry stream is operating within normal quiescent baseline limits."}
            </p>
          </div>
        </div>

        {analysisResult?.primaryRecommendation && isOnline && (
          <div className="shrink-0 flex items-center gap-2">
            <span className="font-semibold text-gray-800">
              Action: {analysisResult.primaryRecommendation.title}
            </span>
          </div>
        )}
      </div>

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
              ...mappedBuildings.map((b) => ({ value: b.id, label: b.name })),
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
          value={isOnline && metrics.flowRateLpm !== null ? metrics.flowRateLpm.toFixed(2) : metrics.lastRecordedFlowLpm.toFixed(2)}
          unit={isOnline ? "L/min" : "L/min (Last)"}
          trend={
            isOnline
              ? {
                  value: (metrics.flowRateLpm ?? 0) > 0 ? "Active Flow" : "Quiescent (Zero Flow)",
                  direction: (metrics.flowRateLpm ?? 0) > 0 ? "up" : "neutral",
                  label: "YF-S201",
                  isPositive: true,
                }
              : {
                  value: "Standby (>120s)",
                  direction: "neutral",
                  label: "Node Offline",
                  isPositive: false,
                }
          }
          icon={<Activity className="w-5 h-5 text-emerald-600" />}
          supportingText={
            isOnline
              ? "Calibrated 7.5 pulses/sec/LPM"
              : (metrics.lastRecordedTimestamp ? `Last recorded: ${metrics.lastRecordedFlowLpm.toFixed(2)} L/min` : "No recent telemetry")
          }
        />

        <KpiCard
          title="Total Measured Volume"
          value={
            isOnline && metrics.totalVolumeLiters !== null
              ? metrics.totalVolumeLiters.toFixed(2)
              : metrics.lastRecordedVolumeLiters > 0
              ? metrics.lastRecordedVolumeLiters.toFixed(2)
              : "0.00"
          }
          unit={isOnline ? "Liters" : "L (Stored)"}
          trend={{
            value: isOnline && metrics.pulseCount !== null
              ? `${metrics.pulseCount.toLocaleString()} pulses`
              : metrics.lastRecordedPulses > 0
              ? `${metrics.lastRecordedPulses.toLocaleString()} pulses`
              : "0 pulses",
            direction: isOnline ? "up" : "neutral",
            label: isOnline ? "Hall Transducer" : "Last recorded",
            isPositive: isOnline,
          }}
          icon={<Droplets className="w-5 h-5 text-teal-600" />}
          supportingText={
            isOnline
              ? "Cumulative pulse counter"
              : (metrics.lastRecordedTimestamp ? `Last recorded: ${formatDate(metrics.lastRecordedTimestamp)}` : "Awaiting telemetry")
          }
        />

        <KpiCard
          title="Water Nodes Online"
          value={metrics.isOnline ? "1 / 1 Online" : "0 / 1 Online (Standby)"}
          unit="Active"
          trend={{
            value: metrics.isOnline ? "Healthy Heartbeat" : "Standby (>120s)",
            direction: metrics.isOnline ? "up" : "neutral",
          }}
          icon={<Cpu className="w-5 h-5 text-emerald-600" />}
          supportingText={metrics.recordId ? `Latest DB Record #${metrics.recordId}` : "Strict 120s Freshness Rule"}
        />

        <KpiCard
          title="Live Anomaly Alerts"
          value={liveAlerts.length}
          unit="Active"
          badge={
            liveAlerts.length > 0 ? (
              <Badge variant={liveAlerts.some((a) => a.severity === "critical") ? "critical" : "warning"}>
                {liveAlerts.length} Critical Event
              </Badge>
            ) : (
              <Badge variant="normal">{isOnline ? "Normal Stream" : "Engine Standby"}</Badge>
            )
          }
          icon={<AlertTriangle className="w-5 h-5 text-red-600" />}
          supportingText={metrics.isOnline ? "AI Rule Engine Evaluating" : "Engine Standby (Node Offline)"}
        />
      </div>

      {/* Live Flow Chart & Historical Section */}
      <ChartCard
        title="Live Water Flow Rate (L/min) & Supabase Telemetry Stream"
        subtitle="Real-time telemetry stream recorded by physical ESP32 and stored in public.telemetry."
        action={
          <div className="flex items-center gap-2">
            {metrics.isOnline ? (
              <span className="text-xs text-emerald-800 font-semibold bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                Live Ingestion Active (5s)
              </span>
            ) : (
              <span className="text-xs text-gray-600 font-semibold bg-gray-100 px-2.5 py-1 rounded-md border border-gray-200 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-gray-500" />
                Stream Standby
              </span>
            )}
          </div>
        }
      >
        <div className="w-full space-y-4">
          {chartPoints.length > 0 ? (
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
          ) : (
            <div className="h-44 w-full flex flex-col items-center justify-center text-center p-6 border border-dashed border-gray-200 rounded-xl bg-gray-50/50">
              <Database className="w-8 h-8 text-gray-400 mb-2" />
              <p className="text-sm font-semibold text-gray-700">Collecting live telemetry stream from ESP32...</p>
              <p className="text-xs text-gray-400 mt-1 max-w-md">
                Telemetry records sent by the physical microcontroller will plot here in real-time as they arrive in Supabase.
              </p>
            </div>
          )}

          <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-100">
            <span>Primary Sensor: YF-S201 Flow Sensor (Calibration Factor: 7.5 Hz/LPM)</span>
            <span>
              Total Measured Volume: {metrics.isOnline && metrics.totalVolumeLiters !== null ? `${metrics.totalVolumeLiters.toFixed(2)} Liters (${metrics.pulseCount?.toLocaleString()} pulses)` : metrics.lastRecordedVolumeLiters > 0 ? `${metrics.lastRecordedVolumeLiters.toFixed(2)} Liters (${metrics.lastRecordedPulses.toLocaleString()} pulses, Last Recorded)` : "Standby"}
            </span>
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
                    No telemetry records stored yet. Send telemetry from ESP32 to populate.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Building Status Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Monitored Facilities Matrix</h3>
            <p className="text-xs text-gray-500">
              Hostel Block A is bound to live hardware node <strong>{metrics.deviceUid}</strong>. Other buildings represent simulated facilities.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBuildings.map((bld) => (
            <BuildingCard key={bld.id} building={bld} />
          ))}
        </div>
      </div>

      {/* Active Alerts in Water Scope */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Active Water Anomaly Events</h3>
            <p className="text-xs text-gray-500">Live anomalies evaluated by the AI engine from real-time telemetry stream.</p>
          </div>
          <button
            onClick={() => setShowHistoricalArchive(!showHistoricalArchive)}
            className="text-xs text-[#0B6B4F] hover:underline font-semibold"
          >
            {showHistoricalArchive ? "Hide Historical Archive" : "View Historical Archive (Demo Data)"}
          </button>
        </div>

        {liveAlerts.length > 0 ? (
          <div className="space-y-3">
            {liveAlerts.map((alert) => (
              <AlertRow key={alert.id} alert={alert} />
            ))}
          </div>
        ) : (
          <div className="p-5 rounded-xl border border-emerald-200 bg-emerald-50/40 text-xs flex items-center justify-between text-emerald-950">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>
                <strong>No Active Anomalies:</strong> Live telemetry is within learned baseline and normal quiescent operating limits.
              </span>
            </div>
            <span className="text-[11px] font-mono text-emerald-800">
              {metrics.latestTimestamp ? `Evaluated: ${formatDate(metrics.latestTimestamp)}` : "Awaiting stream"}
            </span>
          </div>
        )}

        {/* Historical Archive Tab (Demo Data) */}
        {showHistoricalArchive && (
          <div className="mt-4 p-4 rounded-xl border border-amber-200 bg-amber-50/40 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-amber-200 text-xs">
              <span className="font-bold text-amber-950 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                Historical Archive / Sample Incident Log (Demo Data)
              </span>
              <Badge variant="warning">Sample Archive (Aug 2026)</Badge>
            </div>
            <div className="space-y-2">
              {MOCK_ALERTS.map((alert) => (
                <AlertRow
                  key={alert.id}
                  alert={{
                    ...alert,
                    isHistoricalDemo: true,
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

