/**
 * EcoCampus AI — Master Water Intelligence Engine
 * Orchestrates baseline profiling, multi-rule anomaly evaluation, risk scoring,
 * and automated explainability on normalized telemetry streams.
 *
 * SENSOR-AGNOSTIC: Consumes only normalized telemetry parameters (L/min, Liters, ISO timestamps).
 */

import type {
  BaselineProfile,
  DetectedAnomaly,
  NormalizedTelemetry,
  WaterAnalysisResult,
} from "@/types";
import { computeBaselineProfile } from "./baseline-profiler";
import {
  evaluateBaselineDeviationRule,
  evaluateContinuousFlowRule,
  evaluateMicroLeakRule,
  evaluateOffHoursRule,
  evaluateSuddenSpikeRule,
  RuleEvaluationContext,
} from "./anomaly-rules";
import { computeCompositeRiskScore } from "./risk-scorer";
import { generateExplainability } from "./explainability";

export interface WaterEvaluationOptions {
  currentReading: NormalizedTelemetry;
  recentWindow?: NormalizedTelemetry[];
  baselineHistory?: NormalizedTelemetry[];
  locationType?: string;
  locationName?: string;
  offHoursStartUtc?: number;
  offHoursEndUtc?: number;
}

/**
 * Core pure evaluation function.
 * Evaluates a single sensor's latest telemetry reading against historical window and baseline profile.
 */
export function evaluateWaterTelemetry(options: WaterEvaluationOptions): WaterAnalysisResult {
  const {
    currentReading,
    recentWindow = [currentReading],
    baselineHistory = [],
    locationType = "restroom",
    locationName = "Monitored Zone",
    offHoursStartUtc = 0,
    offHoursEndUtc = 5,
  } = options;

  // 1. Compute Dynamic Baseline Profile (with safe cold-start fallback)
  const baseline: BaselineProfile = computeBaselineProfile(
    baselineHistory,
    currentReading.timestamp,
    locationType
  );

  // 2. Prepare rule evaluation context
  const ruleContext: RuleEvaluationContext = {
    currentReading,
    recentWindow: recentWindow.length > 0 ? recentWindow : [currentReading],
    baseline,
    locationType,
    offHoursStartUtc,
    offHoursEndUtc,
  };

  // 3. Evaluate detection rules independently
  const detectedAnomalies: DetectedAnomaly[] = [];

  const continuousFlowAnomaly = evaluateContinuousFlowRule(ruleContext);
  if (continuousFlowAnomaly) detectedAnomalies.push(continuousFlowAnomaly);

  const offHoursAnomaly = evaluateOffHoursRule(ruleContext);
  if (offHoursAnomaly) detectedAnomalies.push(offHoursAnomaly);

  const suddenSpikeAnomaly = evaluateSuddenSpikeRule(ruleContext);
  if (suddenSpikeAnomaly) detectedAnomalies.push(suddenSpikeAnomaly);

  const baselineDeviationAnomaly = evaluateBaselineDeviationRule(ruleContext);
  if (baselineDeviationAnomaly) detectedAnomalies.push(baselineDeviationAnomaly);

  const microLeakAnomaly = evaluateMicroLeakRule(ruleContext);
  if (microLeakAnomaly) detectedAnomalies.push(microLeakAnomaly);

  // 4. Compute composite multi-factor risk score
  const riskResult = computeCompositeRiskScore(detectedAnomalies);

  // 5. Generate human-readable explainability and recommendation
  const currentFlow = Number(currentReading.flow_rate_lpm) || 0;
  const explainability = generateExplainability(
    detectedAnomalies,
    currentFlow,
    locationName
  );

  const isAnomaly = detectedAnomalies.length > 0;

  return {
    sensorId: currentReading.sensor_id,
    deviceId: currentReading.device_id,
    timestamp: currentReading.timestamp,
    latestFlowRateLpm: currentFlow,
    latestTotalVolumeLiters: Number(currentReading.total_volume_liters) || 0,
    baseline,
    anomalies: detectedAnomalies,
    compositeRiskScore: riskResult.score,
    compositeRiskLevel: riskResult.level,
    isAnomaly,
    primaryReason: explainability.detailedReason,
    primaryRecommendation: isAnomaly
      ? {
          title: explainability.recommendedActionTitle,
          description: explainability.recommendedActionDescription,
          priority: explainability.actionPriority,
        }
      : null,
    avoidableVolumeTodayLiters: explainability.avoidableVolumeLiters,
    evaluatedAt: new Date().toISOString(),
  };
}
