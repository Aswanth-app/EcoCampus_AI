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
import {
  MOCK_BUILDINGS,
  MOCK_ALERTS,
  MOCK_INSIGHTS,
  MOCK_HOURLY_TREND,
  MOCK_CAMPUSES,
} from "@/data/mock-data";
import { Droplets, Activity, AlertTriangle, Cpu, Radio, CheckCircle2 } from "lucide-react";
import { Alert } from "@/types";

export default function DashboardPage() {
  const [timeRange, setTimeRange] = useState<"hour" | "day" | "week" | "month">("hour");
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);

  // Live ESP32 Telemetry Feed from Supabase
  const { data: telemetryData, metrics, isLoading, isLiveReceiving, refetch } = useTelemetry(4000);

  const mainCampus = MOCK_CAMPUSES[0];

  // Dynamic Chart points from real Supabase telemetry history
  const recentHistory = telemetryData?.history || [];
  const chartPoints =
    recentHistory.length >= 6
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
      : MOCK_HOURLY_TREND.slice(0, 12);

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
            {metrics.isOnline ? (
              <Badge variant="normal" icon={<Radio className="w-3.5 h-3.5 animate-pulse text-emerald-600" />}>
                ESP32 Hardware Connected
              </Badge>
            ) : (
              <Badge variant="neutral" icon={<Activity className="w-3.5 h-3.5" />}>
                System Ready
              </Badge>
            )}
          </div>
          <p className="text-sm text-gray-500">
            Real-time telemetry stream from physical <strong className="font-medium text-gray-800">{metrics.deviceUid}</strong> on Main Campus.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => (window.location.href = "/devices")}>
            Manage Hardware
          </Button>
          <Button variant="primary" size="sm" onClick={() => (window.location.href = "/water")}>
            Water Analytics $\rightarrow$
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
        recordId={metrics.recordId}
        timestamp={metrics.latestTimestamp}
        lastSeenAt={metrics.lastSeenAt}
        isOnline={metrics.isOnline}
        isLiveReceiving={isLiveReceiving}
        isLoading={isLoading}
        onRefresh={refetch}
      />

      {/* KPI Cards Row (Connected to Live Supabase Telemetry) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="ESP32 Measured Volume"
          value={metrics.totalVolumeLiters > 0 ? metrics.totalVolumeLiters.toFixed(2) : "0.00"}
          unit="Liters"
          trend={{ value: `${metrics.pulseCount.toLocaleString()} pulses`, direction: "up", label: "Hall sensor", isPositive: true }}
          icon={<Droplets className="w-5 h-5 text-emerald-600" />}
          supportingText={metrics.recordId ? `Latest DB Record #${metrics.recordId}` : "Supabase Ingestion Active"}
        />

        <KpiCard
          title="Current Live Flow"
          value={metrics.flowRateLpm.toFixed(1)}
          unit="L/min"
          trend={{
            value: metrics.flowRateLpm > 0 ? "Active Flowing" : "Static / No Flow",
            direction: metrics.flowRateLpm > 0 ? "up" : "neutral",
            label: "YF-S201",
            isPositive: true,
          }}
          icon={<Activity className="w-5 h-5 text-teal-600" />}
          supportingText="Real-time 5s interval sample"
        />

        <KpiCard
          title="Active Alerts"
          value={MOCK_ALERTS.filter((a) => a.status !== "resolved").length}
          unit="Active"
          badge={<Badge variant="critical">1 Critical</Badge>}
          icon={<AlertTriangle className="w-5 h-5 text-red-600" />}
          supportingText="Zero false positives detected"
        />

        <KpiCard
          title="Hardware Nodes"
          value={metrics.isOnline ? "1 / 1 Online" : "1 Registered"}
          unit="Active"
          trend={{
            value: metrics.isOnline ? "Online (ESP32)" : "Standby",
            direction: metrics.isOnline ? "up" : "neutral",
            label: metrics.deviceUid,
          }}
          icon={<Cpu className="w-5 h-5 text-emerald-600" />}
          supportingText={metrics.firmwareVersion ? `Firmware ${metrics.firmwareVersion}` : "100% Ingestion Availability"}
        />
      </div>

      {/* Analytics & Insight Section (Two Column Layout) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Water Consumption Trend Chart (2 cols) */}
        <div className="lg:col-span-2">
          <ChartCard
            title="Real-Time Water Flow Telemetry (L/min)"
            subtitle="Live flow data streamed from ESP32 DevKit V1 + YF-S201 and stored in Supabase public.telemetry."
            action={
              <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg text-xs font-medium">
                {(["hour", "day", "week", "month"] as const).map((range) => (
                  <button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    className={`px-2.5 py-1 rounded-md capitalize transition-colors ${
                      timeRange === range ? "bg-white text-gray-900 shadow-xs font-semibold" : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    {range}
                  </button>
                ))}
              </div>
            }
          >
            {/* Visual SVG Chart Representation with Live Telemetry */}
            <div className="w-full space-y-4">
              <div className="h-48 w-full relative flex items-end justify-between gap-1.5 pt-6 px-2">
                {/* Horizontal Baseline Grid Lines */}
                <div className="absolute inset-x-0 top-6 border-b border-gray-100 text-[10px] text-gray-400 font-mono">10.0 L/min</div>
                <div className="absolute inset-x-0 top-24 border-b border-dashed border-red-200 text-[10px] text-red-400 font-mono">
                  5.0 L/min Flow Threshold
                </div>
                <div className="absolute inset-x-0 bottom-6 border-b border-gray-100 text-[10px] text-gray-400 font-mono">0.0 L/min</div>

                {/* SVG Line / Bar Representation from live telemetry */}
                {chartPoints.map((point: any, i: number) => {
                  const flow = Number(point.flowRateLpm) || 0;
                  const maxChartFlow = 10;
                  const heightPct = Math.min(100, Math.max(8, (flow / maxChartFlow) * 100));
                  const isHigh = flow > 5.0;

                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1 z-10 group relative">
                      {/* Hover Tooltip */}
                      <div className="opacity-0 group-hover:opacity-100 absolute -top-9 bg-gray-900 text-white text-[10px] py-1 px-2 rounded-md whitespace-nowrap transition-opacity pointer-events-none z-20 font-mono">
                        {point.label}: {flow.toFixed(2)} L/min
                        {point.pulseCount !== undefined ? ` • ${point.pulseCount} pulses` : ""}
                      </div>

                      <div
                        style={{ height: `${heightPct}%` }}
                        className={`w-full rounded-t-sm transition-all duration-300 ${
                          isHigh ? "bg-amber-500 hover:bg-amber-600" : "bg-[#0B6B4F] hover:bg-[#064E3B]"
                        }`}
                      />
                      <span className="text-[9px] text-gray-400 font-mono truncate max-w-[45px]">{point.label}</span>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100 px-2">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-xs bg-[#0B6B4F]" /> ESP32 Real-Time Stream
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-xs bg-amber-500" /> Active Flow Period ({">"} 5 L/min)
                </span>
              </div>
            </div>
          </ChartCard>
        </div>

        {/* Right Column: AI Insight & Priority Action */}
        <div className="space-y-6">
          <InsightCard
            insight={MOCK_INSIGHTS[0]}
            onAction={(insight) => {
              const alert = MOCK_ALERTS.find((a) => a.id === insight.alertId);
              if (alert) setSelectedAlert(alert);
            }}
          />

          {/* Hardware Telemetry Pipeline Status */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs">
            <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center justify-between">
              <span>Hardware Data Pipeline</span>
              <Badge variant="normal">Live</Badge>
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
        </div>
      </div>

      {/* Building Monitoring Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Campus Facilities Matrix</h3>
            <p className="text-xs text-gray-500">Hardware nodes deployed across main facilities.</p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => (window.location.href = "/locations")}>
            View All Locations $\rightarrow$
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {MOCK_BUILDINGS.map((bld) => (
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
          <Button variant="outline" size="sm" onClick={() => (window.location.href = "/alerts")}>
            View Alert Center
          </Button>
        </div>

        <div className="space-y-3">
          {MOCK_ALERTS.map((alert) => (
            <AlertRow key={alert.id} alert={alert} onViewDetails={(a) => setSelectedAlert(a)} />
          ))}
        </div>
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
