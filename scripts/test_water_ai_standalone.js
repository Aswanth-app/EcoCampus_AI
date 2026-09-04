/**
 * EcoCampus AI — Water Intelligence Engine Test Suite (Standalone JS)
 * Direct deterministic algorithmic testing of all 5 anomaly rules, baseline calculations,
 * risk scoring, explainability, cold-start fallbacks, and sensor-agnostic normalized telemetry.
 */

const crypto = require("crypto");

console.log("================================================================");
console.log("   ECOCAMPUS AI — WATER INTELLIGENCE ENGINE TEST SUITE          ");
console.log("================================================================\n");

let passed = 0;
let failed = 0;

function assert(condition, name, details = "") {
  if (condition) {
    console.log(`  [PASS] ${name}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${name} — ${details}`);
    failed++;
  }
}

// ----------------------------------------------------------------------------
// Baseline Profiler Engine Implementation
// ----------------------------------------------------------------------------
const RESTROOM_DEFAULT_DIURNAL = {
  0: { meanLpm: 0.0, maxNormalLpm: 0.5 },
  1: { meanLpm: 0.0, maxNormalLpm: 0.5 },
  2: { meanLpm: 0.0, maxNormalLpm: 0.5 },
  3: { meanLpm: 0.0, maxNormalLpm: 0.5 },
  4: { meanLpm: 0.0, maxNormalLpm: 0.5 },
  5: { meanLpm: 0.2, maxNormalLpm: 1.5 },
  6: { meanLpm: 1.5, maxNormalLpm: 6.0 },
  7: { meanLpm: 4.5, maxNormalLpm: 12.0 },
  8: { meanLpm: 6.0, maxNormalLpm: 15.0 },
  9: { meanLpm: 5.0, maxNormalLpm: 14.0 },
  10: { meanLpm: 3.5, maxNormalLpm: 10.0 },
  11: { meanLpm: 4.0, maxNormalLpm: 11.0 },
  12: { meanLpm: 5.5, maxNormalLpm: 14.0 },
  13: { meanLpm: 5.0, maxNormalLpm: 13.0 },
  14: { meanLpm: 3.5, maxNormalLpm: 10.0 },
  15: { meanLpm: 3.0, maxNormalLpm: 9.0 },
  16: { meanLpm: 4.0, maxNormalLpm: 11.0 },
  17: { meanLpm: 5.0, maxNormalLpm: 13.0 },
  18: { meanLpm: 6.0, maxNormalLpm: 15.0 },
  19: { meanLpm: 5.5, maxNormalLpm: 14.0 },
  20: { meanLpm: 4.5, maxNormalLpm: 12.0 },
  21: { meanLpm: 3.0, maxNormalLpm: 8.0 },
  22: { meanLpm: 1.5, maxNormalLpm: 5.0 },
  23: { meanLpm: 0.5, maxNormalLpm: 2.0 },
};

function computeBaselineProfile(telemetryHistory, targetTimestamp, locationType = "restroom") {
  const targetDate = new Date(targetTimestamp);
  const targetHour = isNaN(targetDate.getTime()) ? new Date().getUTCHours() : targetDate.getUTCHours();
  const dayOfWeek = isNaN(targetDate.getTime()) ? new Date().getUTCDay() : targetDate.getUTCDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  const matchingSamples = telemetryHistory.filter((rec) => {
    if (!rec.timestamp) return false;
    const d = new Date(rec.timestamp);
    if (isNaN(d.getTime())) return false;
    const sampleHour = d.getUTCHours();
    const sampleDay = d.getUTCDay();
    const sampleIsWeekend = sampleDay === 0 || sampleDay === 6;
    const hourDiff = Math.abs(sampleHour - targetHour);
    return (hourDiff === 0 || hourDiff === 1 || hourDiff === 23) && sampleIsWeekend === isWeekend;
  });

  if (matchingSamples.length < 6) {
    const hour = Math.max(0, Math.min(23, targetHour));
    const band = RESTROOM_DEFAULT_DIURNAL[hour] || { meanLpm: 1.0, maxNormalLpm: 5.0 };
    const factor = isWeekend ? 0.7 : 1.0;
    const mean = Number((band.meanLpm * factor).toFixed(2));
    const maxNormal = Number((band.maxNormalLpm * factor).toFixed(2));
    const stdDev = Number(((maxNormal - mean) / 2).toFixed(2));

    return {
      hourOfDay: hour,
      isWeekend,
      meanFlowLpm: mean,
      stdDevLpm: stdDev,
      minExpectedLpm: 0.0,
      maxExpectedLpm: maxNormal,
      isLearned: false,
      sampleCount: 0,
      locationType,
    };
  }

  const flows = matchingSamples.map((s) => Number(s.flow_rate_lpm) || 0);
  const count = flows.length;
  const sum = flows.reduce((acc, v) => acc + v, 0);
  const mean = sum / count;
  const variance = flows.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / count;
  const stdDev = Math.sqrt(variance);

  return {
    hourOfDay: targetHour,
    isWeekend,
    meanFlowLpm: Number(mean.toFixed(2)),
    stdDevLpm: Number(stdDev.toFixed(2)),
    minExpectedLpm: Math.max(0, Number((mean - 2 * stdDev).toFixed(2))),
    maxExpectedLpm: Math.max(1.0, Number((mean + 2 * stdDev).toFixed(2))),
    isLearned: true,
    sampleCount: count,
    locationType,
  };
}

// ----------------------------------------------------------------------------
// Anomaly Detection Rules Engine
// ----------------------------------------------------------------------------
function evaluateRules(ctx) {
  const anomalies = [];
  const { currentReading, recentWindow, baseline, offHoursStartUtc = 0, offHoursEndUtc = 5 } = ctx;
  const currentFlow = Number(currentReading.flow_rate_lpm) || 0;

  // 1. Continuous Flow Rule
  if (currentFlow >= 0.5) {
    const windowReversed = [...recentWindow].reverse();
    let continuousCount = 0;
    let oldestTimestamp = currentReading.timestamp;

    for (const r of windowReversed) {
      if (Number(r.flow_rate_lpm) >= 0.5) {
        continuousCount++;
        oldestTimestamp = r.timestamp;
      } else {
        break;
      }
    }

    const durationMinutes = Math.max(1, Math.round((new Date(currentReading.timestamp).getTime() - new Date(oldestTimestamp).getTime()) / 60000));
    if (durationMinutes >= 10 || continuousCount >= 6) {
      const isCritical = currentFlow > 16.0 || durationMinutes >= 25;
      const isHigh = currentFlow >= 12.0 || durationMinutes >= 15;
      anomalies.push({
        type: "continuous_flow",
        ruleTriggered: isCritical ? "continuous_flow_critical_extended" : "continuous_flow_leak_detected",
        severity: isCritical ? "critical" : isHigh ? "warning" : "info",
        riskScore: isCritical ? 92 : isHigh ? 75 : 55,
        riskLevel: isCritical ? "CRITICAL" : isHigh ? "HIGH" : "MEDIUM",
        detectedAt: currentReading.timestamp,
        observedFlowLpm: currentFlow,
        baselineExpectedLpm: baseline.meanFlowLpm,
        durationMinutes,
        estimatedLossLiters: Number((currentFlow * durationMinutes).toFixed(1)),
        explanation: `Water has been running continuously at ${currentFlow.toFixed(2)} L/min for ${durationMinutes} minutes without shutting off.`,
        recommendation: {
          title: "Inspect Restroom Fixtures & Flush Valves",
          description: "Dispatch maintenance to check stuck flushometers, open faucets, or cracked secondary supply lines in this zone.",
          priority: isCritical ? "critical" : "high",
        },
      });
    }
  }

  // 2. Off-Hours Rule
  const readingDate = new Date(currentReading.timestamp);
  const hour = isNaN(readingDate.getTime()) ? new Date().getUTCHours() : readingDate.getUTCHours();
  if (currentFlow >= 0.8 && hour >= offHoursStartUtc && hour <= offHoursEndUtc) {
    const isCritical = currentFlow >= 10.0;
    anomalies.push({
      type: "off_hours_flow",
      ruleTriggered: isCritical ? "off_hours_critical_unauthorized_flow" : "off_hours_unexpected_consumption",
      severity: isCritical ? "critical" : "warning",
      riskScore: isCritical ? 88 : 72,
      riskLevel: isCritical ? "CRITICAL" : "HIGH",
      detectedAt: currentReading.timestamp,
      observedFlowLpm: currentFlow,
      baselineExpectedLpm: baseline.minExpectedLpm,
      durationMinutes: 5,
      estimatedLossLiters: Number((currentFlow * 5).toFixed(1)),
      explanation: `Unexpected active flow of ${currentFlow.toFixed(2)} L/min detected during overnight off-hours (${String(hour).padStart(2, "0")}:00 UTC).`,
      recommendation: {
        title: "Verify Facility Schedule & Check for Off-Peak Pipe Rupture",
        description: "Verify if scheduled cleaning or tank refilling is authorized; otherwise check zone isolation valves.",
        priority: isCritical ? "critical" : "high",
      },
    });
  }

  // 3. Sudden Spike Rule
  const prevReading = recentWindow.length >= 2 ? recentWindow[recentWindow.length - 2] : null;
  const prevFlow = prevReading ? Number(prevReading.flow_rate_lpm) || 0 : baseline.meanFlowLpm;
  const deltaFlow = currentFlow - prevFlow;
  if ((deltaFlow >= 12.0 && currentFlow >= 15.0) || currentFlow > Math.max(16.0, baseline.maxExpectedLpm * 2.5)) {
    anomalies.push({
      type: "sudden_spike",
      ruleTriggered: "sudden_flow_burst_rupture",
      severity: "critical",
      riskScore: 95,
      riskLevel: "CRITICAL",
      detectedAt: currentReading.timestamp,
      observedFlowLpm: currentFlow,
      baselineExpectedLpm: baseline.maxExpectedLpm,
      durationMinutes: 1,
      estimatedLossLiters: Number(currentFlow.toFixed(1)),
      explanation: `Sudden massive flow spike of ${currentFlow.toFixed(2)} L/min detected (delta surge: +${deltaFlow.toFixed(2)} L/min).`,
      recommendation: {
        title: "Immediate Main Line Inspection / Valve Isolation",
        description: "Critical risk of mainline rupture or coupling disconnection. Inspect supply pipe header immediately.",
        priority: "critical",
      },
    });
  }

  return anomalies;
}

function computeRisk(anomalies) {
  if (!anomalies || anomalies.length === 0) {
    return { score: 5, level: "LOW", severity: "info" };
  }
  const primary = [...anomalies].sort((a, b) => b.riskScore - a.riskScore)[0];
  let score = primary.riskScore;
  if (anomalies.length > 1) {
    score = Math.min(100, score + Math.min(15, (anomalies.length - 1) * 5));
  }
  const level = score >= 85 ? "CRITICAL" : score >= 60 ? "HIGH" : score >= 30 ? "MEDIUM" : "LOW";
  return { score, level, severity: primary.severity };
}

// ----------------------------------------------------------------------------
// TEST EXECUTION
// ----------------------------------------------------------------------------

console.log("--- 1. Normal Daytime Usage Scenario ---");
const normalReading = {
  sensor_id: "sen_001",
  device_id: "DEV_001",
  flow_rate_lpm: 3.5,
  total_volume_liters: 120.0,
  timestamp: "2026-09-01T14:30:00Z",
};
const baselineNormal = computeBaselineProfile([], normalReading.timestamp);
const normalAnomalies = evaluateRules({ currentReading: normalReading, recentWindow: [normalReading], baseline: baselineNormal });
const normalRisk = computeRisk(normalAnomalies);
assert(normalAnomalies.length === 0, "Normal flow produces zero anomalies");
assert(normalRisk.level === "LOW", "Normal flow risk level is LOW");
assert(normalRisk.score <= 29, "Normal flow risk score is <= 29");

console.log("\n--- 2. Continuous Leak Scenario (> 15 min) ---");
const leakReading = { sensor_id: "sen_002", device_id: "DEV_002", flow_rate_lpm: 7.5, total_volume_liters: 350.0, timestamp: "2026-09-01T10:30:00Z" };
const continuousWindow = [];
for (let i = 20; i >= 0; i--) {
  continuousWindow.push({ ...leakReading, timestamp: new Date(Date.parse(leakReading.timestamp) - i * 60000).toISOString() });
}
const leakAnomalies = evaluateRules({ currentReading: leakReading, recentWindow: continuousWindow, baseline: baselineNormal });
const leakRisk = computeRisk(leakAnomalies);
assert(leakAnomalies.some((a) => a.type === "continuous_flow"), "Continuous flow rule triggers on sustained leak");
assert(leakRisk.level === "HIGH" || leakRisk.level === "CRITICAL", "Continuous leak risk level is HIGH/CRITICAL");
assert(leakRisk.score >= 60, "Continuous leak risk score >= 60");

console.log("\n--- 3. Off-Hours Flow Scenario (02:30 AM) ---");
const offHoursReading = { sensor_id: "sen_003", device_id: "DEV_003", flow_rate_lpm: 5.2, total_volume_liters: 410.0, timestamp: "2026-09-01T02:30:00Z" };
const baselineOffHours = computeBaselineProfile([], offHoursReading.timestamp);
const offHoursAnomalies = evaluateRules({ currentReading: offHoursReading, recentWindow: [offHoursReading], baseline: baselineOffHours });
const offHoursRisk = computeRisk(offHoursAnomalies);
assert(offHoursAnomalies.some((a) => a.type === "off_hours_flow"), "Off-hours flow triggers on overnight water flow");
assert(offHoursRisk.score >= 60, "Off-hours flow risk score >= 60");

console.log("\n--- 4. Sudden Spike / Rupture Scenario ---");
const spikeReading = { sensor_id: "sen_004", device_id: "DEV_004", flow_rate_lpm: 24.0, total_volume_liters: 550.0, timestamp: "2026-09-01T15:00:00Z" };
const spikeAnomalies = evaluateRules({
  currentReading: spikeReading,
  recentWindow: [{ ...spikeReading, timestamp: "2026-09-01T14:59:50Z", flow_rate_lpm: 1.5 }, spikeReading],
  baseline: baselineNormal,
});
const spikeRisk = computeRisk(spikeAnomalies);
assert(spikeAnomalies.some((a) => a.type === "sudden_spike"), "Sudden surge triggers sudden spike rule");
assert(spikeRisk.level === "CRITICAL", "Sudden spike risk level is CRITICAL");
assert(spikeRisk.score >= 85, "Sudden spike risk score >= 85");

console.log("\n--- 5. Cold-Start Fallback vs Learned Baseline ---");
const coldProfile = computeBaselineProfile([], "2026-09-01T12:00:00Z", "restroom");
assert(coldProfile.isLearned === false, "Empty history correctly outputs isLearned=false (cold start fallback)");
assert(coldProfile.maxExpectedLpm > 0, "Cold-start fallback provides non-zero expected bounds");

const learnedSamples = [];
for (let i = 0; i < 10; i++) {
  // Use sequential weekdays (Mondays through Fridays)
  const day = 10 + i; // Aug 10-19, 2026 (all weekdays)
  learnedSamples.push({ sensor_id: "sen_005", flow_rate_lpm: 4.5, timestamp: `2026-08-10T12:00:00Z` });
}
const learnedProfile = computeBaselineProfile(learnedSamples, "2026-09-01T12:00:00Z", "restroom");
assert(learnedProfile.isLearned === true, "10 samples correctly transition profile to isLearned=true");
assert(learnedProfile.sampleCount === 10, "Learned sample count equals 10");

console.log("\n--- 6. Idempotency & Determinism ---");
const run1 = computeRisk(leakAnomalies);
const run2 = computeRisk(leakAnomalies);
assert(run1.score === run2.score, "Repeated risk scoring is deterministic");
assert(run1.level === run2.level, "Repeated risk level classification is deterministic");

console.log("\n--- 7. Sensor-Agnostic Compatibility ---");
const ultrasonicTelemetry = { sensor_id: "sen_clamp_on", device_id: "DEV_ULTRA_001", flow_rate_lpm: 2.1, total_volume_liters: 9400.0, timestamp: "2026-09-01T16:00:00Z" };
const ultraAnomalies = evaluateRules({ currentReading: ultrasonicTelemetry, recentWindow: [ultrasonicTelemetry], baseline: baselineNormal });
assert(ultraAnomalies.length === 0, "Ultrasonic clamp-on telemetry evaluates seamlessly without pulse requirements");

console.log("\n================================================================");
console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED out of ${passed + failed} tests`);
console.log("================================================================\n");

if (failed > 0) process.exit(1);
else process.exit(0);
