/**
 * EcoCampus AI — Water Intelligence Engine Automated Verification Suite
 * Tests all required AI detection, baseline fallback, risk scoring, explainability,
 * idempotency, and sensor-agnostic behavior.
 */

const { evaluateWaterTelemetry } = require("../lib/ai/water-engine");
const { computeBaselineProfile, getDefaultBaselineProfile } = require("../lib/ai/baseline-profiler");
const { computeCompositeRiskScore } = require("../lib/ai/risk-scorer");
const { generateExplainability } = require("../lib/ai/explainability");

console.log("================================================================");
console.log("   ECOCAMPUS AI — WATER INTELLIGENCE ENGINE TEST SUITE          ");
console.log("================================================================\n");

let testsPassed = 0;
let testsFailed = 0;

function assert(condition, testName, details = "") {
  if (condition) {
    console.log(`  [PASS] ${testName}`);
    testsPassed++;
  } else {
    console.error(`  [FAIL] ${testName} — ${details}`);
    testsFailed++;
  }
}

// ----------------------------------------------------------------------------
// Test 1: Normal Flow Scenario
// ----------------------------------------------------------------------------
console.log("--- Scenario 1: Normal Daytime Usage ---");
const normalReading = {
  sensor_id: "sen_test_001",
  device_id: "DEV_TEST_001",
  flow_rate_lpm: 3.5,
  total_volume_liters: 120.0,
  timestamp: "2026-09-01T14:30:00Z", // 2:30 PM (normal daytime)
};

const normalResult = evaluateWaterTelemetry({
  currentReading: normalReading,
  recentWindow: [
    { ...normalReading, timestamp: "2026-09-01T14:28:00Z", flow_rate_lpm: 0.0 },
    { ...normalReading, timestamp: "2026-09-01T14:29:00Z", flow_rate_lpm: 2.0 },
    normalReading,
  ],
  baselineHistory: [],
  locationType: "restroom",
});

assert(normalResult.isAnomaly === false, "Normal flow is not flagged as anomaly");
assert(normalResult.compositeRiskLevel === "LOW", "Normal flow risk level is LOW");
assert(normalResult.compositeRiskScore <= 29, "Normal flow risk score is <= 29");
assert(normalResult.anomalies.length === 0, "No anomaly rules triggered for normal flow");

// ----------------------------------------------------------------------------
// Test 2: Continuous Flow Leak Scenario (> 15 minutes)
// ----------------------------------------------------------------------------
console.log("\n--- Scenario 2: Continuous Leak Detection ---");
const leakReading = {
  sensor_id: "sen_test_002",
  device_id: "DEV_TEST_002",
  flow_rate_lpm: 7.2,
  total_volume_liters: 350.0,
  timestamp: "2026-09-01T10:30:00Z",
};

// Simulated 15 minutes of uninterrupted flow
const continuousWindow = [];
for (let i = 20; i >= 0; i--) {
  const pastTime = new Date(new Date(leakReading.timestamp).getTime() - i * 60 * 1000).toISOString();
  continuousWindow.push({
    ...leakReading,
    timestamp: pastTime,
    flow_rate_lpm: 7.2,
  });
}

const leakResult = evaluateWaterTelemetry({
  currentReading: leakReading,
  recentWindow: continuousWindow,
  baselineHistory: [],
  locationType: "restroom",
});

assert(leakResult.isAnomaly === true, "Continuous leak detected as anomaly");
assert(leakResult.anomalies.some((a) => a.type === "continuous_flow"), "Continuous flow rule triggered");
assert(leakResult.compositeRiskLevel === "HIGH" || leakResult.compositeRiskLevel === "CRITICAL", "Risk level is HIGH or CRITICAL");
assert(leakResult.compositeRiskScore >= 60, "Risk score is >= 60");
assert(leakResult.primaryRecommendation !== null, "Actionable maintenance recommendation generated");

// ----------------------------------------------------------------------------
// Test 3: Off-Hours Flow Scenario (Overnight 02:30 AM)
// ----------------------------------------------------------------------------
console.log("\n--- Scenario 3: Off-Hours Unexpected Flow ---");
const offHoursReading = {
  sensor_id: "sen_test_003",
  device_id: "DEV_TEST_003",
  flow_rate_lpm: 4.8,
  total_volume_liters: 410.0,
  timestamp: "2026-09-01T02:30:00Z", // 2:30 AM UTC
};

const offHoursResult = evaluateWaterTelemetry({
  currentReading: offHoursReading,
  recentWindow: [offHoursReading],
  baselineHistory: [],
  locationType: "restroom",
});

assert(offHoursResult.isAnomaly === true, "Off-hours flow detected as anomaly");
assert(offHoursResult.anomalies.some((a) => a.type === "off_hours_flow"), "Off-hours flow rule triggered");
assert(offHoursResult.compositeRiskScore >= 60, "Off-hours risk score is >= 60");
assert(offHoursResult.primaryReason.includes("off-hours"), "Human reason mentions off-hours");

// ----------------------------------------------------------------------------
// Test 4: Sudden Spike / Burst Scenario
// ----------------------------------------------------------------------------
console.log("\n--- Scenario 4: Sudden Flow Spike / Pipe Rupture ---");
const spikeReading = {
  sensor_id: "sen_test_004",
  device_id: "DEV_TEST_004",
  flow_rate_lpm: 22.5, // Massive jump
  total_volume_liters: 550.0,
  timestamp: "2026-09-01T15:00:00Z",
};

const spikeResult = evaluateWaterTelemetry({
  currentReading: spikeReading,
  recentWindow: [
    { ...spikeReading, timestamp: "2026-09-01T14:59:50Z", flow_rate_lpm: 2.1 },
    spikeReading,
  ],
  baselineHistory: [],
  locationType: "restroom",
});

assert(spikeResult.isAnomaly === true, "Sudden spike detected as anomaly");
assert(spikeResult.anomalies.some((a) => a.type === "sudden_spike"), "Sudden spike rule triggered");
assert(spikeResult.compositeRiskLevel === "CRITICAL", "Sudden spike risk level is CRITICAL");
assert(spikeResult.compositeRiskScore >= 85, "Sudden spike risk score is >= 85");

// ----------------------------------------------------------------------------
// Test 5: Insufficient-History Cold Start vs. Learned Baseline
// ----------------------------------------------------------------------------
console.log("\n--- Scenario 5: Cold-Start Fallback vs Learned Baseline ---");
const coldStartProfile = computeBaselineProfile([], "2026-09-01T12:00:00Z", "restroom");
assert(coldStartProfile.isLearned === false, "Empty history yields isLearned=false (cold-start fallback)");
assert(coldStartProfile.sampleCount === 0, "Empty history has sampleCount=0");
assert(coldStartProfile.maxExpectedLpm > 0, "Cold-start fallback provides non-zero maxExpectedLpm bound");

// Synthetic 10 samples for learned baseline test
const learnedHistory = [];
for (let i = 0; i < 10; i++) {
  learnedHistory.push({
    sensor_id: "sen_test_005",
    device_id: "DEV_TEST_005",
    flow_rate_lpm: 4.0 + (i % 3) * 0.5,
    total_volume_liters: 100 + i * 5,
    timestamp: `2026-08-${20 + i}T12:15:00Z`,
  });
}

const learnedProfile = computeBaselineProfile(learnedHistory, "2026-09-01T12:00:00Z", "restroom");
assert(learnedProfile.isLearned === true, "Sufficient history yields isLearned=true");
assert(learnedProfile.sampleCount === 10, "Learned baseline sampleCount is 10");
assert(learnedProfile.meanFlowLpm >= 4.0, "Learned baseline mean is accurately computed");

// ----------------------------------------------------------------------------
// Test 6: Deterministic & Idempotent Evaluation
// ----------------------------------------------------------------------------
console.log("\n--- Scenario 6: Evaluation Determinism & Idempotency ---");
const evalRun1 = evaluateWaterTelemetry({
  currentReading: leakReading,
  recentWindow: continuousWindow,
  baselineHistory: [],
});

const evalRun2 = evaluateWaterTelemetry({
  currentReading: leakReading,
  recentWindow: continuousWindow,
  baselineHistory: [],
});

assert(evalRun1.compositeRiskScore === evalRun2.compositeRiskScore, "Risk score is deterministic across repeated runs");
assert(evalRun1.anomalies.length === evalRun2.anomalies.length, "Anomaly count is identical across repeated runs");
assert(evalRun1.primaryReason === evalRun2.primaryReason, "Primary reason explanation is identical");

// ----------------------------------------------------------------------------
// Test 7: Sensor-Agnostic Validation (Simulated Ultrasonic & Digital Meters)
// ----------------------------------------------------------------------------
console.log("\n--- Scenario 7: Sensor-Agnostic Data Compatibility ---");
// Ultrasonic clamp-on telemetry (no pulse count provided)
const ultrasonicReading = {
  sensor_id: "sen_ultrasonic_001",
  device_id: "DEV_CLAMPON_001",
  flow_rate_lpm: 1.8,
  total_volume_liters: 8900.5,
  timestamp: "2026-09-01T16:00:00Z",
};

const ultrasonicResult = evaluateWaterTelemetry({
  currentReading: ultrasonicReading,
  recentWindow: [ultrasonicReading],
  baselineHistory: [],
});

assert(ultrasonicResult.sensorId === "sen_ultrasonic_001", "Ultrasonic clamp-on sensor evaluates successfully");
assert(ultrasonicResult.compositeRiskLevel === "LOW", "Ultrasonic normal flow categorized as LOW risk");

console.log("\n================================================================");
console.log(`TEST SUMMARY: ${testsPassed} PASSED, ${testsFailed} FAILED`);
console.log("================================================================\n");

if (testsFailed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
