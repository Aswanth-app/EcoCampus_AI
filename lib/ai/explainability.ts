/**
 * EcoCampus AI — Water Explainability & Recommendation Generator
 * Translates telemetry anomalies into clear, human-readable insights and facility recommendations.
 */

import type { DetectedAnomaly, WaterAnalysisResult } from "@/types";

export interface ExplainabilitySummary {
  headline: string;
  detailedReason: string;
  recommendedActionTitle: string;
  recommendedActionDescription: string;
  actionPriority: "low" | "medium" | "high" | "critical";
  avoidableVolumeLiters: number;
}

/**
 * Generates plain-English explanation and actionable facility recommendations from an analysis result.
 */
export function generateExplainability(
  anomalies: DetectedAnomaly[],
  currentFlowLpm: number,
  locationName: string = "Monitored Zone"
): ExplainabilitySummary {
  if (!anomalies || anomalies.length === 0) {
    const isZeroFlow = currentFlowLpm < 0.05;
    return {
      headline: isZeroFlow ? "Quiescent Baseline (No Flow)" : "Normal Water Flow Profile",
      detailedReason: isZeroFlow
        ? "No current water flow (0.00 L/min). Monitored fixtures are inactive and operating within normal quiescent baseline."
        : `Water consumption is operating within standard baseline parameters (${currentFlowLpm.toFixed(2)} L/min). No active leaks or off-peak anomalies detected.`,
      recommendedActionTitle: "Routine Monitoring Active",
      recommendedActionDescription: "No maintenance action required. Automated telemetry monitoring continues uninterrupted.",
      actionPriority: "low",
      avoidableVolumeLiters: 0,
    };
  }

  // Pick primary (highest risk) anomaly
  const primary = anomalies.reduce((prev, curr) =>
    curr.riskScore > prev.riskScore ? curr : prev
  );

  // Sum up estimated avoidable water loss across all unique detected issues
  const totalAvoidableLiters = anomalies.reduce(
    (sum, a) => sum + (a.estimatedLossLiters || 0),
    0
  );

  const headline = `Alert: ${primary.explanation.slice(0, 70)}...`;

  return {
    headline,
    detailedReason: `Anomaly detected at ${locationName}: ${primary.explanation}`,
    recommendedActionTitle: primary.recommendation.title,
    recommendedActionDescription: primary.recommendation.description,
    actionPriority: primary.recommendation.priority,
    avoidableVolumeLiters: Number(totalAvoidableLiters.toFixed(1)),
  };
}
