"use client";

import React from "react";
import { Activity, Droplets, Cpu, Radio, Database, CheckCircle2, AlertCircle, RefreshCw, Loader2 } from "lucide-react";
import { formatDate } from "@/lib/utils";

export interface LiveTelemetryCardProps {
  deviceUid: string;
  sensorType: string;
  flowRateLpm: number | null;
  totalVolumeLiters: number | null;
  pulseCount: number | null;
  lastRecordedFlowLpm?: number;
  lastRecordedVolumeLiters?: number;
  lastRecordedPulses?: number;
  recordId: number | null;
  timestamp: string | null;
  lastSeenAt: string | null;
  isOnline: boolean;
  isLiveReceiving?: boolean;
  isLoading?: boolean;
  totalRecordsCount?: number;
  onRefresh?: () => void;
}

export const LiveTelemetryCard: React.FC<LiveTelemetryCardProps> = ({
  deviceUid,
  sensorType,
  flowRateLpm,
  totalVolumeLiters,
  pulseCount,
  lastRecordedFlowLpm = 0,
  lastRecordedVolumeLiters = 0,
  lastRecordedPulses = 0,
  recordId,
  timestamp,
  lastSeenAt,
  isOnline,
  isLiveReceiving = false,
  isLoading = false,
  totalRecordsCount,
  onRefresh,
}) => {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-emerald-950 via-slate-900 to-gray-950 border border-emerald-500/30 text-white p-6 shadow-xl">
      {/* Background glow effects */}
      <div className="absolute -right-16 -top-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -left-16 -bottom-16 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header bar */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-emerald-500/20">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-base text-white tracking-wide">{deviceUid}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-medium border border-emerald-500/30">
                {sensorType}
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 font-mono border border-emerald-500/20">
                PHYSICAL NODE
              </span>
            </div>
            <p className="text-xs text-emerald-200/70 mt-0.5">
              Hostel Block A Inflow Manifold • YF-S201 Flow Sensor (7.5 Hz/LPM)
            </p>
          </div>
        </div>

        {/* Live Status Indicators */}
        <div className="flex items-center gap-2">
          {isLiveReceiving ? (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500 text-slate-950 text-xs font-bold animate-pulse shadow-md shadow-emerald-500/40">
              <Radio className="w-3.5 h-3.5 animate-spin" />
              <span>RECEIVING TELEMETRY</span>
            </div>
          ) : isOnline ? (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-500/40">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>LIVE STREAMING</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold border border-amber-500/40">
              <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
              <span>STANDBY / OFFLINE</span>
            </div>
          )}

          {onRefresh && (
            <button
              onClick={onRefresh}
              className={`p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white transition-colors ${
                isLoading ? "animate-spin" : ""
              }`}
              title="Refresh Live Data"
              aria-label="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Primary Metrics Grid */}
      <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-4 pt-5">
        {/* Metric 1: Instantaneous Flow */}
        <div className="bg-white/5 rounded-xl p-3.5 border border-white/10 backdrop-blur-xs">
          <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-1">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            <span>Instantaneous Flow</span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-mono text-white tracking-tight">
              {isLoading && recordId === null ? (
                <Loader2 className="w-5 h-5 animate-spin text-emerald-400 inline" />
              ) : isOnline && flowRateLpm !== null ? (
                flowRateLpm.toFixed(2)
              ) : (
                "--"
              )}
            </span>
            <span className="text-xs text-emerald-400 font-medium">{isOnline ? "L/min" : ""}</span>
          </div>
          <p className="text-[10px] text-gray-400 mt-1 truncate">
            {isOnline
              ? "Live calibrated stream"
              : `Last recorded: ${lastRecordedFlowLpm.toFixed(2)} L/min`}
          </p>
        </div>

        {/* Metric 2: Total Volume */}
        <div className="bg-white/5 rounded-xl p-3.5 border border-white/10 backdrop-blur-xs">
          <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-1">
            <Droplets className="w-3.5 h-3.5 text-teal-400" />
            <span>Measured Volume</span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-mono text-white tracking-tight">
              {isLoading && recordId === null ? (
                <Loader2 className="w-5 h-5 animate-spin text-teal-400 inline" />
              ) : isOnline && totalVolumeLiters !== null ? (
                totalVolumeLiters.toFixed(2)
              ) : (
                "--"
              )}
            </span>
            <span className="text-xs text-teal-400 font-medium">{isOnline ? "Liters" : ""}</span>
          </div>
          <p className="text-[10px] text-gray-400 mt-1 truncate">
            {isOnline
              ? "Cumulative live volume"
              : `Last recorded: ${lastRecordedVolumeLiters.toFixed(2)} L`}
          </p>
        </div>

        {/* Metric 3: Total Pulses */}
        <div className="bg-white/5 rounded-xl p-3.5 border border-white/10 backdrop-blur-xs">
          <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-1">
            <Radio className="w-3.5 h-3.5 text-cyan-400" />
            <span>Pulse Counter</span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-mono text-white tracking-tight">
              {isLoading && recordId === null ? (
                <Loader2 className="w-5 h-5 animate-spin text-cyan-400 inline" />
              ) : isOnline && pulseCount !== null ? (
                pulseCount.toLocaleString()
              ) : (
                "--"
              )}
            </span>
            <span className="text-xs text-cyan-400 font-medium">{isOnline ? "pulses" : ""}</span>
          </div>
          <p className="text-[10px] text-gray-400 mt-1 truncate">
            {isOnline
              ? "450 pulses ≈ 1 Liter"
              : `Last recorded: ${lastRecordedPulses.toLocaleString()} pulses`}
          </p>
        </div>

        {/* Metric 4: Hardware Node Pipeline Status */}
        <div className="bg-white/5 rounded-xl p-3.5 border border-white/10 backdrop-blur-xs">
          <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-1">
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            <span>Supabase Sync</span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className={`text-lg font-bold font-mono ${isOnline ? "text-emerald-300" : "text-amber-300"}`}>
              {isLoading && recordId === null
                ? "Connecting..."
                : isOnline
                ? (recordId ? `#${recordId} (Live)` : "Live Stream")
                : "Standby"}
            </span>
            <span className="text-[11px] text-gray-400 font-sans">
              {totalRecordsCount ? `(${totalRecordsCount} in DB)` : ""}
            </span>
          </div>
          <p className="text-[10px] text-gray-400 mt-1 truncate">
            {isOnline && timestamp
              ? `Live: ${formatDate(timestamp)}`
              : lastSeenAt
              ? `Last Seen: ${formatDate(lastSeenAt)}`
              : "No telemetry recorded"}
          </p>
        </div>
      </div>

      {/* Footer verification note */}
      <div className="relative z-10 flex flex-wrap items-center justify-between text-[11px] text-emerald-200/80 mt-4 pt-3 border-t border-emerald-500/15 gap-2">
        <span className="flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>
            {isOnline
              ? "Pipeline: ESP32 → Wi-Fi → Next.js API → Supabase → Live Dashboard"
              : "Pipeline: Ready for ESP32 telemetry (Node currently in standby)"}
          </span>
        </span>
        <span className="font-mono text-gray-400">
          Heartbeat Rule: 120s • {isOnline ? "Fresh Stream Active" : "Stale / Offline"}
        </span>
      </div>
    </div>
  );
};

