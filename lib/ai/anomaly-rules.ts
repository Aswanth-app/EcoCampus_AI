/**
 * EcoCampus AI — Water Anomaly Detection Rules
 * Evaluates normalized telemetry streams against physical and statistical threshold rules.
 * Strictly sensor-independent (operates purely on flow_rate_lpm and duration).
 */

import type {
  BaselineProfile,
  DetectedAnomaly,
  NormalizedTelemetry,
} from "@/types";

export interface RuleEvaluationContext {
  currentReading: NormalizedTelemetry;
  recentWindow: NormalizedTelemetry[]; // Sorted chronologically (oldest to newest)
  baseline: BaselineProfile;
  locationType?: string;
  offHoursStartUtc?: number; // Default: 0 (midnight)
  offHoursEndUtc?: number;   // Default: 5 (05:00 AM)
}

/**
 * 1. Continuous Flow Leak Rule
 * Detects persistent continuous flow without returning to zero over an observation window.
 */
export function evaluateContinuousFlowRule(ctx: RuleEvaluationContext): DetectedAnomaly | null {
  const { currentReading, recentWindow } = ctx;
  const currentFlow = Number(currentReading.flow_rate_lpm) || 0;

  if (currentFlow < 0.5) {
    return null; // Zero or negligible flow is normal
  }

  // Find continuous non-zero flow stretch ending at the current reading
  const windowReversed = [...recentWindow].reverse();
  let continuousReadings = 0;
  let oldestContinuousTimestamp = currentReading.timestamp;

  for (const r of windowReversed) {
    const flow = Number(r.flow_rate_lpm) || 0;
    if (flow >= 0.5) {
      continuousReadings++;
      oldestContinuousTimestamp = r.timestamp;
    } else {
      break;
    }
  }

  // Calculate elapsed duration in minutes
  const nowMs = new Date(currentReading.timestamp).getTime();
  const startMs = new Date(oldestContinuousTimestamp).getTime();
  const durationMinutes = Math.max(1, Math.round((nowMs - startMs) / (1000 * 60)));

  // Threshold: Flow persisting for >= 10 minutes continuously (or >= 6 consecutive 5s-interval readings if window is short)
  const isContinuous = durationMinutes >= 10 || continuousReadings >= 6;

  if (!isContinuous) return null;

  const estimatedLoss = Number(((currentFlow * durationMinutes)).toFixed(1));
  // High Flow & Duration Tiers:
  // - Critical: Flow > 16.0 L/min OR continuous duration >= 25 minutes
  // - High Risk: Flow 12.0 to 16.0 L/min OR continuous duration >= 15 minutes
  // - Medium: Continuous flow below 12.0 L/min
  const isCritical = currentFlow > 16.0 || durationMinutes >= 25;
  const isHigh = currentFlow >= 12.0 || durationMinutes >= 15;

  const severity = isCritical ? "critical" : isHigh ? "warning" : "info";
  const riskScore = isCritical ? 92 : isHigh ? 75 : 55;
  const riskLevel = isCritical ? "CRITICAL" : isHigh ? "HIGH" : "MEDIUM";

  return {
    type: "continuous_flow",
    ruleTriggered: isCritical
      ? "continuous_flow_critical_extended"
      : "continuous_flow_leak_detected",
    severity,
    riskScore,
    riskLevel,
    detectedAt: currentReading.timestamp,
    observedFlowLpm: currentFlow,
    baselineExpectedLpm: ctx.baseline.meanFlowLpm,
    durationMinutes,
    estimatedLossLiters: estimatedLoss,
    explanation: `Water has been running continuously at ${currentFlow.toFixed(2)} L/min for ${durationMinutes} minutes without shutting off.`,
    recommendation: {
      title: "Inspect Restroom Fixtures & Flush Valves",
      description: "Dispatch maintenance to check stuck flushometers, open faucets, or cracked secondary supply lines in this zone.",
      priority: isCritical ? "critical" : "high",
    },
    evidence: {
      continuous_readings_count: continuousReadings,
      duration_minutes: durationMinutes,
      flow_rate_lpm: currentFlow,
      baseline_mean_lpm: ctx.baseline.meanFlowLpm,
    },
  };
}

/**
 * 2. Unexpected Off-Hours Water Usage Rule
 * Detects significant water consumption during configured facility curfew hours.
 */
export function evaluateOffHoursRule(ctx: RuleEvaluationContext): DetectedAnomaly | null {
  const { currentReading, baseline, offHoursStartUtc = 0, offHoursEndUtc = 5 } = ctx;
  const currentFlow = Number(currentReading.flow_rate_lpm) || 0;

  if (currentFlow < 0.8) return null;

  const readingDate = new Date(currentReading.timestamp);
  const hour = isNaN(readingDate.getTime()) ? new Date().getUTCHours() : readingDate.getUTCHours();

  const isOffHours = hour >= offHoursStartUtc && hour <= offHoursEndUtc;
  if (!isOffHours) return null;

  const isCritical = currentFlow >= 10.0;
  const isHigh = currentFlow >= 4.0;

  const severity = isCritical ? "critical" : isHigh ? "warning" : "info";
  const riskScore = isCritical ? 88 : isHigh ? 72 : 50;
  const riskLevel = isCritical ? "CRITICAL" : isHigh ? "HIGH" : "MEDIUM";

  return {
    type: "off_hours_flow",
    ruleTriggered: isCritical
      ? "off_hours_critical_unauthorized_flow"
      : "off_hours_unexpected_consumption",
    severity,
    riskScore,
    riskLevel,
    detectedAt: currentReading.timestamp,
    observedFlowLpm: currentFlow,
    baselineExpectedLpm: baseline.minExpectedLpm,
    durationMinutes: 5,
    estimatedLossLiters: Number((currentFlow * 5).toFixed(1)),
    explanation: `Unexpected active flow of ${currentFlow.toFixed(2)} L/min detected during overnight off-hours (${String(hour).padStart(2, "0")}:00 UTC) when baseline expected flow is 0.0 L/min.`,
    recommendation: {
      title: "Verify Facility Schedule & Check for Off-Peak Pipe Rupture",
      description: "Verify if scheduled cleaning or tank refilling is authorized; otherwise immediately check zone isolation valves.",
      priority: isCritical ? "critical" : "high",
    },
    evidence: {
      hour_utc: hour,
      flow_rate_lpm: currentFlow,
      off_hours_window: `${offHoursStartUtc}:00 - ${offHoursEndUtc}:00 UTC`,
    },
  };
}

/**
 * 3. Sudden Spike / Rupture Rule
 * Detects instantaneous surges exceeding rated pipe bounds or sudden step-changes.
 */
export function evaluateSuddenSpikeRule(ctx: RuleEvaluationContext): DetectedAnomaly | null {
  const { currentReading, recentWindow, baseline } = ctx;
  const currentFlow = Number(currentReading.flow_rate_lpm) || 0;

  // Compare against previous reading in window to detect instantaneous step change
  const prevReading = recentWindow.length >= 2 ? recentWindow[recentWindow.length - 2] : null;
  const prevFlow = prevReading ? Number(prevReading.flow_rate_lpm) || 0 : baseline.meanFlowLpm;
  const deltaFlow = currentFlow - prevFlow;

  // Spike condition: sudden jump > 12 L/min OR exceeding 3x expected max baseline
  const isSurgeSpike = deltaFlow >= 12.0 && currentFlow >= 15.0;
  const isBaselineBreach = currentFlow > Math.max(16.0, baseline.maxExpectedLpm * 2.5);

  if (!isSurgeSpike && !isBaselineBreach) return null;

  const severity = "critical";
  const riskScore = 95;
  const riskLevel = "CRITICAL";

  return {
    type: "sudden_spike",
    ruleTriggered: "sudden_flow_burst_rupture",
    severity,
    riskScore,
    riskLevel,
    detectedAt: currentReading.timestamp,
    observedFlowLpm: currentFlow,
    baselineExpectedLpm: baseline.maxExpectedLpm,
    durationMinutes: 1,
    estimatedLossLiters: Number((currentFlow * 1).toFixed(1)),
    explanation: `Sudden massive flow spike of ${currentFlow.toFixed(2)} L/min detected (delta surge: +${deltaFlow.toFixed(2)} L/min). Significantly exceeds normal ceiling of ${baseline.maxExpectedLpm.toFixed(1)} L/min.`,
    recommendation: {
      title: "Immediate Main Line Inspection / Valve Isolation",
      description: "Critical risk of mainline rupture or coupling disconnection. Inspect supply pipe header immediately.",
      priority: "critical",
    },
    evidence: {
      flow_rate_lpm: currentFlow,
      delta_from_previous_lpm: Number(deltaFlow.toFixed(2)),
      baseline_max_expected_lpm: baseline.maxExpectedLpm,
    },
  };
}

/**
 * 4. Statistical Baseline Deviation Rule (Z-score test)
 * Evaluates whether current flow significantly exceeds learned Gaussian distribution.
 */
export function evaluateBaselineDeviationRule(ctx: RuleEvaluationContext): DetectedAnomaly | null {
  const { currentReading, baseline } = ctx;
  const currentFlow = Number(currentReading.flow_rate_lpm) || 0;

  if (currentFlow <= baseline.maxExpectedLpm || currentFlow < 2.0) return null;

  // Calculate standard Z-score
  const stdDev = Math.max(0.8, baseline.stdDevLpm);
  const zScore = (currentFlow - baseline.meanFlowLpm) / stdDev;

  if (zScore < 2.5) return null;

  const isCritical = zScore >= 4.0 || currentFlow > 20.0;
  const isHigh = zScore >= 3.0;

  const severity = isCritical ? "critical" : isHigh ? "warning" : "info";
  const riskScore = isCritical ? 85 : isHigh ? 68 : 45;
  const riskLevel = isCritical ? "CRITICAL" : isHigh ? "HIGH" : "MEDIUM";

  return {
    type: "baseline_deviation",
    ruleTriggered: isCritical
      ? "baseline_deviation_severe_zscore"
      : "baseline_deviation_elevated",
    severity,
    riskScore,
    riskLevel,
    detectedAt: currentReading.timestamp,
    observedFlowLpm: currentFlow,
    baselineExpectedLpm: baseline.meanFlowLpm,
    durationMinutes: 5,
    estimatedLossLiters: Number(((currentFlow - baseline.meanFlowLpm) * 5).toFixed(1)),
    explanation: `Water flow of ${currentFlow.toFixed(2)} L/min exceeds normal baseline expectation (${baseline.meanFlowLpm.toFixed(1)} L/min) with a statistical deviation score of Z = ${zScore.toFixed(1)}σ.`,
    recommendation: {
      title: "Audit Elevated Water Demand",
      description: "Review concurrent fixture usage in this zone to determine whether high volume is temporary or abnormal wastage.",
      priority: isCritical ? "high" : "medium",
    },
    evidence: {
      flow_rate_lpm: currentFlow,
      baseline_mean_lpm: baseline.meanFlowLpm,
      baseline_std_dev: baseline.stdDevLpm,
      z_score: Number(zScore.toFixed(2)),
      is_learned_baseline: baseline.isLearned,
    },
  };
}

/**
 * 5. Micro-Leak / Slow Creep Rule
 * Detects persistent low-level non-zero trickle (0.2 to 1.5 L/min) during quiescent periods.
 */
export function evaluateMicroLeakRule(ctx: RuleEvaluationContext): DetectedAnomaly | null {
  const { currentReading, recentWindow } = ctx;
  const currentFlow = Number(currentReading.flow_rate_lpm) || 0;

  if (currentFlow < 0.2 || currentFlow > 1.8) return null;

  // Check if at least 5 consecutive readings in the recent window are in this low-flow band
  if (recentWindow.length < 5) return null;

  const lowFlowReadings = recentWindow.filter((r) => {
    const f = Number(r.flow_rate_lpm) || 0;
    return f >= 0.2 && f <= 1.8;
  });

  const isPersistentMicroLeak = lowFlowReadings.length >= 5;
  if (!isPersistentMicroLeak) return null;

  return {
    type: "leakage_suspected",
    ruleTriggered: "micro_leakage_slow_creep",
    severity: "warning",
    riskScore: 62,
    riskLevel: "MEDIUM",
    detectedAt: currentReading.timestamp,
    observedFlowLpm: currentFlow,
    baselineExpectedLpm: 0.0,
    durationMinutes: 15,
    estimatedLossLiters: Number((currentFlow * 15).toFixed(1)),
    explanation: `Persistent low-level seepage / trickle of ${currentFlow.toFixed(2)} L/min detected across consecutive observation windows.`,
    recommendation: {
      title: "Check Toilet Flappers, Bib Taps & Float Valves",
      description: "Slow continuous leakage typically originates from worn flapper seals or weeping tap cartridges. Perform visual dye test.",
      priority: "medium",
    },
    evidence: {
      trickle_flow_lpm: currentFlow,
      sample_count: lowFlowReadings.length,
    },
  };
}
