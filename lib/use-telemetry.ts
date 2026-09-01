"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { supabase, isSupabaseConfigured } from "./supabase";

export interface TelemetryRecord {
  id: number;
  sensor_id: string;
  flow_rate_lpm: number;
  total_volume_liters: number;
  pulse_count: number;
  timestamp: string;
  received_at: string;
  status: string;
}

export interface DeviceRecord {
  id: string;
  device_uid: string;
  device_type: string;
  status: "online" | "offline" | "inactive";
  firmware_version: string;
  last_seen_at: string;
  created_at: string;
  location_id?: string;
}

export interface SensorRecord {
  id: string;
  device_id: string;
  sensor_type: string;
  resource_type: string;
  unit: string;
  calibration_factor: number;
  status: string;
}

export interface LiveTelemetryResponse {
  device: DeviceRecord | null;
  sensor: SensorRecord | null;
  latest: TelemetryRecord | null;
  history: TelemetryRecord[];
  meta: {
    total_records_returned: number;
    is_online: boolean;
    is_live_streaming: boolean;
    fetched_at: string;
  };
}

export function useTelemetry(pollIntervalMs: number = 5000) {
  const [data, setData] = useState<LiveTelemetryResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [isLiveReceiving, setIsLiveReceiving] = useState<boolean>(false);
  const prevRecordIdRef = useRef<number | null>(null);

  const fetchLiveTelemetry = useCallback(async (isBackground: boolean = false) => {
    try {
      if (!isBackground && !data) {
        setIsLoading(true);
      }

      const res = await fetch("/api/v1/telemetry/live", {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" },
      });

      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}`);
      }

      const json = await res.json();
      if (json.success && json.data) {
        const nextData = json.data as LiveTelemetryResponse;
        
        // Detect new record arrival
        if (
          nextData.latest?.id &&
          prevRecordIdRef.current !== null &&
          nextData.latest.id !== prevRecordIdRef.current
        ) {
          setIsLiveReceiving(true);
          setTimeout(() => setIsLiveReceiving(false), 4000);
        }
        prevRecordIdRef.current = nextData.latest?.id || null;

        setData(nextData);
        setLastSync(new Date());
        setError(null);
      } else {
        setError(json.error || "Failed to parse telemetry data");
      }
    } catch (err: any) {
      console.warn("useTelemetry fetch warning:", err?.message);
      setError(err?.message || "Failed to load live telemetry");
    } finally {
      setIsLoading(false);
    }
  }, [data]);

  // Initial fetch and polling loop
  useEffect(() => {
    fetchLiveTelemetry(false);

    const interval = setInterval(() => {
      fetchLiveTelemetry(true);
    }, pollIntervalMs);

    return () => clearInterval(interval);
  }, [fetchLiveTelemetry, pollIntervalMs]);

  // Supabase Realtime channel subscription (instant trigger on insert)
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    const channel = supabase
      .channel("realtime-telemetry-feed")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "telemetry",
        },
        () => {
          setIsLiveReceiving(true);
          fetchLiveTelemetry(true);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "devices",
        },
        () => {
          fetchLiveTelemetry(true);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchLiveTelemetry]);

  // Derived metrics
  const latest = data?.latest;
  const device = data?.device;
  const flowRateLpm = latest ? Number(latest.flow_rate_lpm) : 0;
  const totalVolumeLiters = latest ? Number(latest.total_volume_liters) : 0;
  const pulseCount = latest ? Number(latest.pulse_count) : 0;
  const recordId = latest?.id ?? null;
  const latestTimestamp = latest?.timestamp ?? null;
  const isOnline = data?.meta?.is_online ?? false;

  return {
    data,
    isLoading,
    error,
    lastSync,
    isLiveReceiving,
    metrics: {
      flowRateLpm,
      totalVolumeLiters,
      pulseCount,
      recordId,
      latestTimestamp,
      isOnline,
      deviceUid: device?.device_uid || "DEV_ESP32_001",
      sensorType: data?.sensor?.sensor_type || "YF-S201",
      firmwareVersion: device?.firmware_version || "v2.4.1",
      lastSeenAt: device?.last_seen_at || null,
    },
    refetch: () => fetchLiveTelemetry(false),
  };
}
