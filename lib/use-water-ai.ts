"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import type { WaterAnalysisResult, RiskLevel, DetectedAnomaly, BaselineProfile, Alert, Insight } from "@/types";
import { LiveTelemetryResponse, useTelemetry } from "./use-telemetry";
import { evaluateWaterTelemetry } from "./ai/water-engine";

export function useWaterAi(
  pollIntervalMs: number = 6000,
  externalTelemetryData?: LiveTelemetryResponse | null,
  isOnlineOverride?: boolean
) {
  // Only invoke internal useTelemetry if external data is not provided
  const internalTelemetry = useTelemetry(externalTelemetryData ? 0 : 4000);
  const telemetryData = externalTelemetryData !== undefined ? externalTelemetryData : internalTelemetry.data;
  const isOnline = isOnlineOverride !== undefined ? isOnlineOverride : internalTelemetry.metrics.isOnline;

  const [analysisResult, setAnalysisResult] = useState<WaterAnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const runEvaluation = useCallback(async () => {
    try {
      // STRICT RULE: Only evaluate active live telemetry if node is verified online within heartbeat window
      if (!isOnline || !telemetryData?.latest) {
        setAnalysisResult(null);
        setError(null);
        setIsLoading(false);
        return;
      }

      const latest = telemetryData.latest;
      const history = telemetryData.history || [];

      const normalizedHistory = history.map((t) => ({
        sensor_id: t.sensor_id,
        device_id: telemetryData.device?.device_uid || "DEV_ESP32_001",
        flow_rate_lpm: Number(t.flow_rate_lpm) || 0,
        total_volume_liters: Number(t.total_volume_liters) || 0,
        pulse_count: t.pulse_count,
        timestamp: t.timestamp,
      }));

      const currentReading = {
        sensor_id: latest.sensor_id,
        device_id: telemetryData.device?.device_uid || "DEV_ESP32_001",
        flow_rate_lpm: Number(latest.flow_rate_lpm) || 0,
        total_volume_liters: Number(latest.total_volume_liters) || 0,
        pulse_count: latest.pulse_count,
        timestamp: latest.timestamp,
      };

      // Real-time evaluation on the active normalized telemetry stream
      const result = evaluateWaterTelemetry({
        currentReading,
        recentWindow: normalizedHistory.slice(0, 15).reverse(),
        baselineHistory: normalizedHistory,
        locationType: "restroom",
        locationName: "Ground Floor Restroom",
      });

      setAnalysisResult(result);
      setError(null);
    } catch (err: any) {
      console.warn("useWaterAi evaluation error:", err?.message);
      setError(err?.message || "AI evaluation failed");
    } finally {
      setIsLoading(false);
    }
  }, [telemetryData, isOnline]);

  useEffect(() => {
    runEvaluation();
    const interval = setInterval(runEvaluation, pollIntervalMs);
    return () => clearInterval(interval);
  }, [runEvaluation, pollIntervalMs]);

  const riskScore: number = isOnline ? (analysisResult?.compositeRiskScore ?? 0) : 0;
  const riskLevel: RiskLevel = isOnline ? (analysisResult?.compositeRiskLevel ?? "NORMAL") : "NORMAL";
  const isAnomaly: boolean = isOnline ? (analysisResult?.isAnomaly ?? false) : false;
  const activeAnomalies: DetectedAnomaly[] = isOnline ? (analysisResult?.anomalies ?? []) : [];
  const baseline: BaselineProfile | null = isOnline ? (analysisResult?.baseline ?? null) : null;

  // Convert active anomalies into genuine live Alert objects (STRICTLY empty when offline)
  const liveAlerts: Alert[] = useMemo(() => {
    if (!isOnline || !activeAnomalies || activeAnomalies.length === 0 || !telemetryData?.latest) {
      return [];
    }
    const latest = telemetryData.latest;
    const devUid = telemetryData.device?.device_uid || "DEV_ESP32_001";
    const currentFlow = Number(latest.flow_rate_lpm) || 0;

    return activeAnomalies.map((anm, idx) => {
      const typeMap: Record<string, "continuous_flow" | "critical_high_flow" | "unusual_off_peak" | "device_offline"> = {
        continuous_flow: "continuous_flow",
        off_hours_flow: "unusual_off_peak",
        sudden_spike: "critical_high_flow",
        baseline_deviation: "unusual_off_peak",
        leakage_suspected: "continuous_flow",
      };

      const titleMap: Record<string, string> = {
        continuous_flow: "Continuous Water Flow Leak Detected",
        off_hours_flow: "Unauthorized Off-Hours Consumption",
        sudden_spike: "Critical Flow Spike / Rupture Risk",
        baseline_deviation: "Elevated Baseline Demand Anomaly",
        leakage_suspected: "Persistent Micro-Leak Seepage",
      };

      return {
        id: `live_alert_${anm.type}_${anm.detectedAt || latest.id}_${idx}`,
        organizationId: "org_ecoflux_01",
        campusId: "cmp_main_01",
        buildingId: "bld_hostel_a",
        locationId: "loc_hba_gf_washroom",
        deviceId: telemetryData.device?.id || "dev_001",
        sensorId: latest.sensor_id,
        anomalyEventId: `anm_${anm.ruleTriggered}`,
        severity: anm.severity,
        alertType: typeMap[anm.type] || "continuous_flow",
        title: titleMap[anm.type] || "Water Anomaly Alert",
        message: anm.explanation,
        buildingName: "Hostel Block A",
        locationName: "Ground Floor Restroom",
        deviceUid: devUid,
        currentFlowLpm: currentFlow,
        durationMinutes: anm.durationMinutes || 5,
        status: "pending",
        detectedAt: anm.detectedAt || latest.timestamp,
        recommendationTitle: anm.recommendation.title,
        recommendationDescription: anm.recommendation.description,
        isLiveAlert: true,
      };
    });
  }, [activeAnomalies, telemetryData, isOnline]);

  // Dynamically generate genuine Live AI Insight based on live telemetry & anomaly engine state
  const liveInsight: Insight | null = useMemo(() => {
    if (!isOnline) {
      return {
        id: "ins_live_offline",
        title: "Node Heartbeat Standby",
        buildingName: "Hostel Block A",
        locationName: "Ground Floor Restroom",
        avoidableVolumeLiters: 0,
        recommendedAction: "Physical node DEV_ESP32_001 has had no heartbeat in >120s. Telemetry stream is in standby. Connect hardware to resume live intelligence.",
        severity: "info",
        alertId: "alt_standby",
        createdAt: new Date().toISOString(),
      };
    }

    if (!analysisResult || !telemetryData?.latest) {
      return null;
    }

    const currentFlow = analysisResult.latestFlowRateLpm;
    const isZeroFlow = currentFlow < 0.05;

    if (isAnomaly && activeAnomalies.length > 0) {
      const primary = activeAnomalies[0];
      return {
        id: `ins_live_${primary.type}`,
        title: primary.recommendation.title,
        buildingName: "Hostel Block A",
        locationName: "Ground Floor Restroom",
        avoidableVolumeLiters: analysisResult.avoidableVolumeTodayLiters || 0,
        recommendedAction: primary.recommendation.description,
        severity: primary.severity === "critical" ? "critical" : "warning",
        alertId: liveAlerts[0]?.id || "live_alert_01",
        createdAt: analysisResult.evaluatedAt,
      };
    }

    return {
      id: "ins_live_normal",
      title: isZeroFlow ? "Quiescent Baseline Ingestion" : "Standard Operating Water Flow",
      buildingName: "Hostel Block A",
      locationName: "Ground Floor Restroom",
      avoidableVolumeLiters: 0,
      recommendedAction: isZeroFlow
        ? "No active flow detected. Hall-effect sensor is in standby and ready for consumption pulses."
        : "Current water flow rate is within learned campus baseline parameters. No action required.",
      severity: "info",
      alertId: "alt_normal",
      createdAt: analysisResult.evaluatedAt,
    };
  }, [analysisResult, telemetryData, isOnline, isAnomaly, activeAnomalies, liveAlerts]);

  return {
    analysisResult,
    riskScore,
    riskLevel,
    isAnomaly,
    activeAnomalies,
    liveAlerts,
    liveInsight,
    baseline,
    isLoading,
    error,
    isOnline,
    evaluatedAt: analysisResult?.evaluatedAt || null,
    evaluateNow: runEvaluation,
  };
}

