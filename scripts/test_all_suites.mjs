/**
 * EcoCampus AI — Unified Verification & Test Runner
 * Executes both:
 * 1. Telemetry Ingest & API Security Test Suite (Phase 4 MVP baseline)
 * 2. Water Intelligence & Anomaly Engine Test Suite (Phase 5 Intelligence layer)
 */

import { evaluateWaterTelemetry } from "../lib/ai/water-engine.ts";
import { computeBaselineProfile, getDefaultBaselineProfile } from "../lib/ai/baseline-profiler.ts";
import { computeCompositeRiskScore } from "../lib/ai/risk-scorer.ts";
import { generateExplainability } from "../lib/ai/explainability.ts";
import { hashDeviceApiKey, safeHashCompare } from "../lib/security.ts";
import { MOCK_DEVICES, MOCK_SENSORS } from "../data/mock-data.ts";

console.log("================================================================");
console.log("   ECOCAMPUS AI — UNIFIED INTEGRATION & VERIFICATION SUITE       ");
console.log("================================================================\n");

let totalPassed = 0;
let totalFailed = 0;

function assert(condition, name, details = "") {
  if (condition) {
    console.log(`  [PASS] ${name}`);
    totalPassed++;
  } else {
    console.error(`  [FAIL] ${name} — ${details}`);
    totalFailed++;
  }
}

// ============================================================================
// PART 1: WATER AI INTELLIGENCE ENGINE SCENARIOS
// ============================================================================
console.log("----------------------------------------------------------------");
console.log("PART 1: WATER AI INTELLIGENCE & ANOMALY DETECTION ENGINE");
console.log("----------------------------------------------------------------\n");

// Test 1.1: Normal Flow Scenario
console.log("--- 1.1: Normal Daytime Usage ---");
const normalReading = {
  sensor_id: "sen_w_001",
  device_id: "DEV_ESP32_001",
  flow_rate_lpm: 3.5,
  total_volume_liters: 120.0,
  timestamp: "2026-09-01T14:30:00Z", // 2:30 PM (daytime)
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
assert(normalResult.anomalies.length === 0, "Zero anomaly rules triggered for normal flow");

// Test 1.2: Continuous Flow Leak Scenario (> 15 minutes)
console.log("\n--- 1.2: Continuous Flow Leak Detection ---");
const leakReading = {
  sensor_id: "sen_w_001",
  device_id: "DEV_ESP32_001",
  flow_rate_lpm: 7.2,
  total_volume_liters: 350.0,
  timestamp: "2026-09-01T10:30:00Z",
};

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
assert(leakResult.compositeRiskLevel === "HIGH" || leakResult.compositeRiskLevel === "CRITICAL", "Risk level is HIGH/CRITICAL");
assert(leakResult.compositeRiskScore >= 60, "Risk score is >= 60");
assert(leakResult.primaryRecommendation !== null, "Actionable maintenance recommendation generated");

// Test 1.3: Off-Hours Flow Scenario (Overnight 02:30 AM)
console.log("\n--- 1.3: Off-Hours Unexpected Flow ---");
const offHoursReading = {
  sensor_id: "sen_w_001",
  device_id: "DEV_ESP32_001",
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

// Test 1.4: Sudden Spike / Burst Scenario
console.log("\n--- 1.4: Sudden Flow Spike / Rupture ---");
const spikeReading = {
  sensor_id: "sen_w_001",
  device_id: "DEV_ESP32_001",
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

// Test 1.5: Insufficient-History Cold Start vs. Learned Baseline
console.log("\n--- 1.5: Cold-Start Fallback vs Learned Baseline ---");
const coldStartProfile = computeBaselineProfile([], "2026-09-01T12:00:00Z", "restroom");
assert(coldStartProfile.isLearned === false, "Empty history yields isLearned=false (cold-start fallback)");
assert(coldStartProfile.sampleCount === 0, "Empty history has sampleCount=0");
assert(coldStartProfile.maxExpectedLpm > 0, "Cold-start fallback provides non-zero maxExpectedLpm bound");

const learnedHistory = [];
for (let i = 0; i < 10; i++) {
  learnedHistory.push({
    sensor_id: "sen_w_001",
    device_id: "DEV_ESP32_001",
    flow_rate_lpm: 4.0 + (i % 3) * 0.5,
    total_volume_liters: 100 + i * 5,
    timestamp: `2026-08-${20 + i}T12:15:00Z`,
  });
}

const learnedProfile = computeBaselineProfile(learnedHistory, "2026-09-01T12:00:00Z", "restroom");
assert(learnedProfile.isLearned === true, "Sufficient history yields isLearned=true");
assert(learnedProfile.sampleCount === 10, "Learned baseline sampleCount is 10");
assert(learnedProfile.meanFlowLpm >= 4.0, "Learned baseline mean is accurately computed");

// Test 1.6: Deterministic & Idempotent Evaluation
console.log("\n--- 1.6: Evaluation Determinism & Idempotency ---");
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

// Test 1.7: Sensor-Agnostic Validation (Simulated Ultrasonic & Digital Meters)
console.log("\n--- 1.7: Sensor-Agnostic Data Compatibility ---");
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

// ============================================================================
// PART 2: SECURITY & TELEMETRY INGESTION VALIDATION (EXISTING MVP PRESERVATION)
// ============================================================================
console.log("\n----------------------------------------------------------------");
console.log("PART 2: TELEMETRY INGESTION & SECURITY VALIDATION");
console.log("----------------------------------------------------------------\n");

// Test 2.1: API Key Hash Verification
console.log("--- 2.1: Security & API Key Cryptography ---");
const testApiKey = "dev_secret_key_001";
const hash1 = hashDeviceApiKey(testApiKey);
const hash2 = hashDeviceApiKey(testApiKey);
assert(hash1 === hash2, "Deterministic SHA-256 API key hashing");
assert(safeHashCompare(hash1, hash2) === true, "Constant-time safeHashCompare succeeds on matching hash");
assert(safeHashCompare(hash1, hashDeviceApiKey("wrong_key")) === false, "safeHashCompare rejects invalid key");

// Test 2.2: Device Registry Integrity
console.log("\n--- 2.2: Mock Device & Sensor Registry Hierarchy ---");
const esp32Node = MOCK_DEVICES.find((d) => d.deviceUid === "DEV_ESP32_001");
assert(esp32Node !== undefined, "Primary DEV_ESP32_001 device registered");
assert(esp32Node.status === "online", "DEV_ESP32_001 status is online");

const primarySensor = MOCK_SENSORS.find((s) => s.deviceId === esp32Node.id);
assert(primarySensor !== undefined, "Primary sensor attached to DEV_ESP32_001");
assert(primarySensor.resourceType === "water", "Primary sensor resource type is water");

console.log("\n================================================================");
console.log(`FINAL RESULTS: ${totalPassed} PASSED, ${totalFailed} FAILED out of ${totalPassed + totalFailed} tests`);
console.log("================================================================\n");

if (totalFailed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
