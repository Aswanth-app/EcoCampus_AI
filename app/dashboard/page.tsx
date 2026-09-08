"use client";

import React, { useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { KpiCard } from "@/components/ui/kpi-card";
import { ChartCard } from "@/components/ui/chart-card";
import { BuildingCard } from "@/components/ui/building-card";
import { AlertRow } from "@/components/ui/alert-row";
import { InsightCard } from "@/components/ui/insight-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { LiveTelemetryCard } from "@/components/ui/live-telemetry-card";
import { useTelemetry } from "@/lib/use-telemetry";
import { useWaterAi } from "@/lib/use-water-ai";
import {
  MOCK_BUILDINGS,
  MOCK_ALERTS,
  MOCK_CAMPUSES,
} from "@/data/mock-data";
import { formatDate } from "@/lib/utils";
import { Droplets, Activity, AlertTriangle, Cpu, Radio, CheckCircle2, AlertCircle, Database, ShieldCheck, Lock, Award } from "lucide-react";
import { Alert, Building } from "@/types";

export default function DashboardPage() {
  const [timeRange, setTimeRange] = useState<"hour" | "day" | "week" | "month">("hour");
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [showHistoricalArchive, setShowHistoricalArchive] = useState(false);

  // Live ESP32 Telemetry Feed from Supabase
  const { data: telemetryData, metrics, isLoading, isLiveReceiving, refetch } = useTelemetry(4000);

  // Live Water Intelligence & Anomaly Engine Hook
  const { analysisResult, riskScore, riskLevel, isAnomaly, liveAlerts, liveInsight, isOnline } = useWaterAi(6000, telemetryData, metrics.isOnline);

  const mainCampus = MOCK_CAMPUSES[0];

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

  // Dynamic Chart points from real Supabase telemetry history only
  const recentHistory = telemetryData?.history || [];
  const chartPoints =
    recentHistory.length > 0
      ? recentHistory
          .slice(0, 12)
          .reverse()
          .map((rec) => {
            const timeStr = rec.timestamp ? new Date(rec.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : `#${rec.id}`;
            return {
              label: timeStr,
              flowRateLpm: Number(rec.flow_rate_lpm) || 0,
              totalVolumeLiters: Number(rec.total_volume_liters) || 0,
              pulseCount: rec.pulse_count,
              id: rec.id,
            };
          })
      : [];

  return (
    <AppShell>
      {/* Breadcrumb Context */}
      <Breadcrumb
        items={[
          { label: "Eco Flux University" },
          { label: "Main Campus", href: "/dashboard" },
          { label: "Overview" },
        ]}
      />

      {/* Header Greeting */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-2xl font-bold tracking-tight text-gray-900">Facility Operations & Water Telemetry</h2>
            {isOnline ? (
              <Badge variant="normal" icon={<Radio className="w-3.5 h-3.5 animate-pulse text-emerald-600" />}>
                ESP32 Hardware Connected
              </Badge>
            ) : (
              <Badge variant="neutral" icon={<Activity className="w-3.5 h-3.5 text-gray-500" />}>
                Node in Standby / Offline
              </Badge>
            )}
          </div>
          <p className="text-sm text-gray-500">
            {isOnline
              ? `Real-time telemetry stream from physical ${metrics.deviceUid} on Main Campus.`
              : `Physical hardware ${metrics.deviceUid} is currently in standby (>120s without heartbeat).`}
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
          <Button variant="outline" size="sm" onClick={() => (window.location.href = "/devices")}>
            Manage Hardware
          </Button>
          <Button variant="primary" size="sm" onClick={() => (window.location.href = "/water")}>
            Water Analytics
          </Button>
        </div>
      </div>

      {/* LIVE Physical ESP32 Hardware Status Card */}
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

      {/* KPI Cards Row (Connected to Live Supabase Telemetry) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
            label: isOnline ? "Hall sensor" : "Last recorded",
            isPositive: isOnline,
          }}
          icon={<Droplets className="w-5 h-5 text-emerald-600" />}
          supportingText={
            isOnline
              ? (metrics.recordId ? `Live DB Record #${metrics.recordId}` : "Live Streaming Active")
              : (metrics.lastRecordedTimestamp ? `Last recorded: ${formatDate(metrics.lastRecordedTimestamp)}` : "Awaiting telemetry")
          }
        />

        <KpiCard
          title="Current Flow Rate"
          value={isOnline && metrics.flowRateLpm !== null ? metrics.flowRateLpm.toFixed(2) : metrics.lastRecordedFlowLpm.toFixed(2)}
          unit={isOnline ? "L/min" : "L/min (Last)"}
          trend={
            isOnline
              ? {
                  value: (metrics.flowRateLpm ?? 0) > 0 ? "Active Flowing" : "Quiescent (Zero Flow)",
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
          icon={<Activity className="w-5 h-5 text-teal-600" />}
          supportingText={
            isOnline
              ? "Real-time 5s interval sample"
              : (metrics.lastRecordedTimestamp ? `Last recorded flow: ${metrics.lastRecordedFlowLpm.toFixed(2)} L/min` : "No recent telemetry")
          }
        />

        <KpiCard
          title="Live Active Alerts"
          value={liveAlerts.length}
          unit="Active"
          badge={
            liveAlerts.length > 0 ? (
              <Badge variant={liveAlerts.some((a) => a.severity === "critical") ? "critical" : "warning"}>
                {liveAlerts.length} Critical
              </Badge>
            ) : (
              <Badge variant="normal">{isOnline ? "Normal Baseline" : "Engine Standby"}</Badge>
            )
          }
          icon={<AlertTriangle className="w-5 h-5 text-red-600" />}
          supportingText={isOnline ? "Live AI Rule Evaluation" : "No live alerts (Node Offline)"}
        />

        <KpiCard
          title="Water Nodes Online"
          value={metrics.isOnline ? "1 / 1 Online" : "0 / 1 Online (Standby)"}
          unit="Active"
          trend={{
            value: metrics.isOnline ? "Online (ESP32)" : "Standby (>120s)",
            direction: metrics.isOnline ? "up" : "neutral",
            label: metrics.deviceUid,
          }}
          icon={<Cpu className="w-5 h-5 text-emerald-600" />}
          supportingText={metrics.firmwareVersion ? `Firmware ${metrics.firmwareVersion}` : "Strict 120s Freshness Rule"}
        />
      </div>

      {/* Analytics & Insight Section (Two Column Layout) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Water Consumption Trend Chart (2 cols) */}
        <div className="lg:col-span-2">
          <ChartCard
            title="Hourly Water Consumption & Real-time Flow Stream"
            subtitle="Comparing current flow telemetry against typical historical campus baseline."
            action={
              <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg text-xs">
                {(["hour", "day", "week", "month"] as const).map((range) => (
                  <button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    className={`px-2.5 py-1 rounded-md capitalize font-medium transition-all ${
                      timeRange === range
                        ? "bg-white text-gray-900 shadow-xs font-semibold"
                        : "text-gray-500 hover:text-gray-900"
                    }`}
                  >
                    {range}
                  </button>
                ))}
              </div>
            }
          >
            {chartPoints.length > 0 ? (
              <>
                <div className="h-64 w-full flex items-end justify-between gap-2 pt-6 px-2">
                  {chartPoints.map((point: any, idx: number) => {
                    const heightPct = Math.min(100, Math.max(15, (point.flowRateLpm / 15) * 100));
                    const isCurrentPeak = point.flowRateLpm > 10;

                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-1 group relative">
                        {/* Tooltip on hover */}
                        <div className="opacity-0 group-hover:opacity-100 absolute -top-8 bg-gray-900 text-white text-[10px] py-1 px-2 rounded-md whitespace-nowrap transition-opacity pointer-events-none z-20 font-mono">
                          {point.label}: {point.flowRateLpm.toFixed(2)} L/min
                        </div>

                        <div
                          style={{ height: `${heightPct}%` }}
                          className={`w-full rounded-t-sm transition-all duration-300 ${
                            isCurrentPeak ? "bg-amber-500" : "bg-[#0B6B4F]"
                          }`}
                        />
                        <span className="text-[10px] text-gray-400 font-mono truncate max-w-[36px]">{point.label}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500 mt-4 pt-3 border-t border-gray-100">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-xs bg-[#0B6B4F]" /> Measured Flow (L/min)
                  </span>
                  <span className="flex items-center gap-1.5 font-mono text-[11px]">
                    Cumulative Stream: {metrics.isOnline && metrics.totalVolumeLiters !== null ? `${metrics.totalVolumeLiters.toFixed(2)} Liters` : metrics.lastRecordedVolumeLiters > 0 ? `${metrics.lastRecordedVolumeLiters.toFixed(2)} L (Last Recorded)` : "Standby"}
                  </span>
                </div>
              </>
            ) : (
              <div className="h-56 w-full flex flex-col items-center justify-center text-center p-6 border border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                <Database className="w-8 h-8 text-gray-400 mb-2" />
                <p className="text-sm font-semibold text-gray-700">Collecting live telemetry stream from ESP32...</p>
                <p className="text-xs text-gray-400 mt-1 max-w-md">
                  Real records recorded by the physical node will plot here as they are received by Supabase.
                </p>
              </div>
            )}
          </ChartCard>
        </div>

        {/* Right Column: Dynamic Live AI Insight & Priority Action */}
        <div className="space-y-6">
          {liveInsight ? (
            <InsightCard
              insight={liveInsight}
              onAction={() => (window.location.href = "/water")}
            />
          ) : (
            <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-xs text-xs text-gray-500">
              <p className="font-semibold text-gray-800">AI Resource Intelligence</p>
              <p className="mt-1">AI insight will appear after sufficient live telemetry is collected.</p>
            </div>
          )}

          {/* Hardware Telemetry Pipeline Status */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs">
            <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center justify-between">
              <span>Hardware Data Pipeline</span>
              {isOnline ? (
                <Badge variant="normal">Live</Badge>
              ) : (
                <Badge variant="neutral">Standby</Badge>
              )}
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                <span className="font-medium text-gray-700">Node Identifier</span>
                <span className="font-mono text-emerald-800 font-bold">{metrics.deviceUid}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                <span className="font-medium text-gray-700">Sensor Type</span>
                <span className="font-semibold text-gray-800">{metrics.sensorType} (7.5 Hz/LPM)</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                <span className="font-medium text-gray-700">Database Storage</span>
                <span className="text-emerald-700 font-medium">Supabase public.telemetry</span>
              </div>
            </div>
          </div>

          {/* Cybersecurity & Threat Posture Card */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Security & Privacy Posture</span>
              </h4>
              <Badge variant="normal">Protected</Badge>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                <span className="font-medium text-gray-700">API Ingest Auth</span>
                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> SHA-256 Verified
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                <span className="font-medium text-gray-700">Device Identity</span>
                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Hardware UID Bound
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                <span className="font-medium text-gray-700">Audit & Events</span>
                <span className="text-emerald-700 font-semibold">Active In-Memory Log</span>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
              <span className="text-[11px] text-gray-400">8 / 8 Active Controls</span>
              <button
                onClick={() => (window.location.href = "/security")}
                className="text-xs text-[#0B6B4F] hover:underline font-semibold flex items-center gap-1"
              >
                Security Center &rarr;
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Building Monitoring Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Campus Facilities Matrix</h3>
            <p className="text-xs text-gray-500">
              Hostel Block A is bound to live hardware node <strong>{metrics.deviceUid}</strong>. Other buildings represent simulated facilities.
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => (window.location.href = "/locations")}>
            View All Locations
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mappedBuildings.map((bld) => (
            <BuildingCard
              key={bld.id}
              building={bld}
              onSelect={() => (window.location.href = `/locations`)}
            />
          ))}
        </div>
      </div>

      {/* Recent Alerts Feed */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Recent Operational Alerts</h3>
            <p className="text-xs text-gray-500">Automated leak detection and anomaly evaluation events.</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowHistoricalArchive(!showHistoricalArchive)}
              className="text-xs text-[#0B6B4F] hover:underline font-semibold"
            >
              {showHistoricalArchive ? "Hide Historical Archive" : "View Historical Archive (Demo Data)"}
            </button>
            <Button variant="outline" size="sm" onClick={() => (window.location.href = "/alerts")}>
              View Alert Center
            </Button>
          </div>
        </div>

        {liveAlerts.length > 0 ? (
          <div className="space-y-3">
            {liveAlerts.map((alert) => (
              <AlertRow key={alert.id} alert={alert} onViewDetails={(a) => setSelectedAlert(a)} />
            ))}
          </div>
        ) : (
          <div className="p-5 rounded-xl border border-emerald-200 bg-emerald-50/40 text-xs flex items-center justify-between text-emerald-950">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>
                <strong>No Active Anomalies:</strong> Live telemetry is within baseline operating parameters.
              </span>
            </div>
            <span className="text-[11px] font-mono text-emerald-800">
              {metrics.latestTimestamp ? `Evaluated: ${formatDate(metrics.latestTimestamp)}` : "Awaiting stream"}
            </span>
          </div>
        )}

        {/* Historical Archive Feed (Demo Data) */}
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
                  onViewDetails={(a) => setSelectedAlert(a)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Alert Investigation Modal */}
      {selectedAlert && (
        <Modal
          isOpen={!!selectedAlert}
          onClose={() => setSelectedAlert(null)}
          title={`Investigate Alert: ${selectedAlert.title}`}
          subtitle={`Device: ${selectedAlert.deviceUid} • ${selectedAlert.buildingName}`}
          footer={
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setSelectedAlert(null)}>
                Close
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  alert(`Alert ${selectedAlert.id} status updated to RESOLVED.`);
                  setSelectedAlert(null);
                }}
              >
                Confirm & Mark Resolved
              </Button>
            </div>
          }
        >
          <div className="space-y-4 text-xs text-gray-700">
            <div className="p-3 rounded-lg bg-red-50 border border-red-200">
              <p className="font-semibold text-red-900 mb-1">{selectedAlert.message}</p>
              <p className="text-red-700">Detected at {selectedAlert.detectedAt} (Duration: {selectedAlert.durationMinutes} mins)</p>
            </div>

            <div className="space-y-2">
              <h5 className="font-semibold text-gray-900">Recommended Action:</h5>
              <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
                <p className="font-medium text-gray-800">{selectedAlert.recommendationTitle}</p>
                <p className="text-gray-600 mt-1">{selectedAlert.recommendationDescription}</p>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </AppShell>
  );
}

