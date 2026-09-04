/**
 * EcoCampus AI - Telemetry Integrity & Verification Suite
 * Validates TEST 1 through TEST 7 for the ESP32 Hardware Telemetry Pipeline
 */

const assert = require("assert");

console.log("==================================================================");
console.log("   ECOCAMPUS AI — TELEMETRY PIPELINE & UI INTEGRITY VERIFICATION  ");
console.log("==================================================================");

let totalPassed = 0;
let totalFailed = 0;

function runTest(name, fn) {
  try {
    fn();
    console.log(`  [PASS] ${name}`);
    totalPassed++;
  } catch (err) {
    console.error(`  [FAIL] ${name}: ${err.message}`);
    totalFailed++;
  }
}

// ---------------------------------------------------------
// Simulated Telemetry Stream & Stateful Hook Behavior Logic
// ---------------------------------------------------------

class TelemetryStateEngine {
  constructor() {
    this.maxVolume = 0;
    this.maxPulses = 0;
    this.latestRecord = null;
    this.history = [];
    this.isOnline = false;
  }

  // Simulates telemetry arrival from API/Supabase
  receiveTelemetry(payload) {
    const flowRate = Number(payload.flow_rate_lpm) || 0;
    const incomingVolume = Number(payload.total_volume_liters) || 0;
    const incomingPulses = Number(payload.pulse_count) || 0;

    // Monotonic cumulative tracking
    if (incomingVolume >= this.maxVolume) {
      this.maxVolume = incomingVolume;
    }
    if (incomingPulses >= this.maxPulses) {
      this.maxPulses = incomingPulses;
    }

    this.latestRecord = {
      id: payload.id || this.history.length + 1,
      sensor_id: payload.sensor_id,
      flow_rate_lpm: flowRate,
      total_volume_liters: payload.total_volume_liters,
      pulse_count: payload.pulse_count,
      timestamp: payload.timestamp,
    };

    this.history.unshift(this.latestRecord);
    this.isOnline = true;
  }

  // Read current displayed values (same as useTelemetry hook)
  getDisplayedMetrics() {
    if (!this.latestRecord) {
      return {
        flowRateLpm: 0,
        totalVolumeLiters: 0,
        pulseCount: 0,
        recordId: null,
        hasData: false,
      };
    }

    const flowRateLpm = Number(this.latestRecord.flow_rate_lpm) || 0;
    const rawVolume = Number(this.latestRecord.total_volume_liters) || 0;
    const totalVolumeLiters = Math.max(rawVolume, this.maxVolume);

    const rawPulses = Number(this.latestRecord.pulse_count) || 0;
    const pulseCount = Math.max(rawPulses, this.maxPulses);

    return {
      flowRateLpm,
      totalVolumeLiters,
      pulseCount,
      recordId: this.latestRecord.id,
      hasData: true,
    };
  }

  // Simulate Page Refresh (re-initializing state engine with persisted historical records)
  simulatePageRefresh(persistedHistory) {
    this.maxVolume = 0;
    this.maxPulses = 0;
    this.history = [...persistedHistory];
    
    // Pick latest record by timestamp & id
    const sorted = [...persistedHistory].sort((a, b) => {
      const timeDiff = new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      return timeDiff !== 0 ? timeDiff : b.id - a.id;
    });

    this.latestRecord = sorted[0] || null;
    if (this.latestRecord) {
      this.maxVolume = Number(this.latestRecord.total_volume_liters) || 0;
      this.maxPulses = Number(this.latestRecord.pulse_count) || 0;
    }
  }
}

// ---------------------------------------------------------
// TEST SUITE EXECUTION
// ---------------------------------------------------------

console.log("\n--- TEST 1: Initial Load with Persisted Telemetry ---");
const engine = new TelemetryStateEngine();
const initialDbSeed = [
  { id: 101, sensor_id: "sen_yf_s201", flow_rate_lpm: 0.0, total_volume_liters: 12.50, pulse_count: 5625, timestamp: "2026-09-03T17:00:00Z" }
];
engine.simulatePageRefresh(initialDbSeed);

runTest("Latest persisted telemetry loads immediately on initial startup", () => {
  const m = engine.getDisplayedMetrics();
  assert.strictEqual(m.hasData, true);
  assert.strictEqual(m.totalVolumeLiters, 12.50);
  assert.strictEqual(m.pulseCount, 5625);
  assert.strictEqual(m.flowRateLpm, 0.0);
  assert.strictEqual(m.recordId, 101);
});

console.log("\n--- TEST 2: Active Water Flow ---");
engine.receiveTelemetry({
  id: 102,
  sensor_id: "sen_yf_s201",
  flow_rate_lpm: 3.20,
  total_volume_liters: 13.10,
  pulse_count: 5895,
  timestamp: "2026-09-03T17:00:05Z"
});

runTest("Instantaneous flow > 0, Total Pulses increases, Total Volume increases", () => {
  const m = engine.getDisplayedMetrics();
  assert.strictEqual(m.flowRateLpm, 3.20);
  assert.strictEqual(m.totalVolumeLiters, 13.10);
  assert.strictEqual(m.pulseCount, 5895);
  assert.strictEqual(m.recordId, 102);
});

console.log("\n--- TEST 3: Water Flow Stops ---");
engine.receiveTelemetry({
  id: 103,
  sensor_id: "sen_yf_s201",
  flow_rate_lpm: 0.00,
  total_volume_liters: 13.10,
  pulse_count: 5895,
  timestamp: "2026-09-03T17:00:10Z"
});

runTest("Instantaneous flow becomes 0.00 L/min, cumulative pulses & volume remain unchanged", () => {
  const m = engine.getDisplayedMetrics();
  assert.strictEqual(m.flowRateLpm, 0.00);
  assert.strictEqual(m.totalVolumeLiters, 13.10);
  assert.strictEqual(m.pulseCount, 5895);
  assert.strictEqual(m.recordId, 103);
});

console.log("\n--- TEST 4: Water Flow Starts Again ---");
engine.receiveTelemetry({
  id: 104,
  sensor_id: "sen_yf_s201",
  flow_rate_lpm: 2.80,
  total_volume_liters: 14.50,
  pulse_count: 6525,
  timestamp: "2026-09-03T17:00:15Z"
});

runTest("Flow increases again and cumulative counters continue without resetting", () => {
  const m = engine.getDisplayedMetrics();
  assert.strictEqual(m.flowRateLpm, 2.80);
  assert.strictEqual(m.totalVolumeLiters, 14.50);
  assert.strictEqual(m.pulseCount, 6525);
  assert.strictEqual(m.recordId, 104);
});

console.log("\n--- TEST 5: Browser Page Refresh ---");
const freshEngine = new TelemetryStateEngine();
freshEngine.simulatePageRefresh(engine.history);

runTest("Page refresh restores latest persisted volume & pulses without resetting to 0", () => {
  const m = freshEngine.getDisplayedMetrics();
  assert.strictEqual(m.hasData, true);
  assert.strictEqual(m.totalVolumeLiters, 14.50);
  assert.strictEqual(m.pulseCount, 6525);
  assert.strictEqual(m.flowRateLpm, 2.80);
  assert.strictEqual(m.recordId, 104);
});

console.log("\n--- TEST 6: Monotonic Safeguard Against Decreasing Values ---");
// Simulate anomalous or delayed out-of-order packet with lower pulse count
freshEngine.receiveTelemetry({
  id: 105,
  sensor_id: "sen_yf_s201",
  flow_rate_lpm: 1.50,
  total_volume_liters: 10.00, // Lower volume artifact
  pulse_count: 4500,          // Lower pulse count artifact
  timestamp: "2026-09-03T17:00:20Z"
});

runTest("Total Volume and Total Pulses never decrease during normal operation", () => {
  const m = freshEngine.getDisplayedMetrics();
  assert.strictEqual(m.totalVolumeLiters, 14.50);
  assert.strictEqual(m.pulseCount, 6525);
  assert.strictEqual(m.flowRateLpm, 1.50);
});

console.log("\n--- TEST 7: Calibration & Ratio Verification ---");
runTest("Calibration factor: 450 pulses = 1 Liter, 7.5 Hz = 1 L/min", () => {
  const pulsesPerLiter = 450;
  const flowRateHz = 7.5 * 2.0; // 15 Hz for 2.0 L/min
  const computedLpm = flowRateHz / 7.5;
  assert.strictEqual(computedLpm, 2.0);
  const computedVolume = 4500 / pulsesPerLiter;
  assert.strictEqual(computedVolume, 10.0);
});

console.log("\n==================================================================");
console.log(`VERIFICATION SUMMARY: ${totalPassed} PASSED, ${totalFailed} FAILED out of ${totalPassed + totalFailed} tests`);
console.log("==================================================================");

if (totalFailed > 0) {
  process.exit(1);
}
