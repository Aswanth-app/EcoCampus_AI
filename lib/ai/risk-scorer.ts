/**
 * EcoCampus AI — Water Risk Scorer
 * Computes deterministic multi-factor risk scores (0 to 100) and risk classifications.
 */

import type { AlertSeverity, DetectedAnomaly, RiskLevel } from "@/types";

export interface CompositeRiskScore {
  score: number;
  level: RiskLevel;
  severity: AlertSeverity;
  primaryAnomaly: DetectedAnomaly | null;
}

/**
 * Calculates a unified composite risk score based on all triggered anomaly rules.
 */
export function computeCompositeRiskScore(anomalies: DetectedAnomaly[]): CompositeRiskScore {
  if (!anomalies || anomalies.length === 0) {
    return {
      score: 0,
      level: "NORMAL",
      severity: "info",
      primaryAnomaly: null,
    };
  }

  // Sort anomalies by risk score descending (highest risk first)
  const sorted = [...anomalies].sort((a, b) => b.riskScore - a.riskScore);
  const primary = sorted[0];

  // Base score comes from the highest-priority anomaly
  let combinedScore = primary.riskScore;

  // Additional simultaneous anomalies add a compounding penalty (+5 per extra anomaly, max +15)
  if (sorted.length > 1) {
    const compoundingPenalty = Math.min(15, (sorted.length - 1) * 5);
    combinedScore = Math.min(100, combinedScore + compoundingPenalty);
  }

  // Determine risk level category (0-30 Normal, 31-50 Low, 51-75 Medium, 76-100 Critical)
  let level: RiskLevel = "NORMAL";
  let severity: AlertSeverity = "info";

  if (combinedScore >= 76) {
    level = "CRITICAL";
    severity = "critical";
  } else if (combinedScore >= 51) {
    level = "MEDIUM";
    severity = "warning";
  } else if (combinedScore >= 31) {
    level = "LOW";
    severity = "info";
  } else {
    level = "NORMAL";
    severity = "info";
  }

  return {
    score: combinedScore,
    level,
    severity,
    primaryAnomaly: primary,
  };
}
