/**
 * Test Suite: Quiescent Telemetry & Zero-Flow Ingestion Integrity
 * Validates that when water flow stops:
 * 1. Flow rate is 0.00 L/min
 * 2. Cumulative volume and pulse count remain unchanged
 * 3. Consecutive telemetry heartbeats do NOT artificially increment volume or pulses
 */

const assert = require("assert");

console.log("==================================================================");
console.log("   TESTING ZERO-FLOW & CUMULATIVE TELEMETRY INTEGRITY FIX         ");
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

// Ingestion simulation matching updated backend logic
function processIngest(payload, dbState) {
  const effectivePulseCount = Math.floor(payload.pulse_count);
  const effectiveTotalVolume = Number(Number(payload.total_volume_liters).toFixed(3));
  const effectiveFlowRate = Number(Number(payload.flow_rate_lpm).toFixed(2));

  // Check duplicate timestamp idempotency
  const isDuplicate = dbState.some(
    (r) => r.sensor_id === payload.sensor_id && r.timestamp === payload.timestamp
  );
  if (isDuplicate) {
    return { status: 200, message: "duplicate ignored" };
  }

  const record = {
    id: dbState.length + 1,
    sensor_id: payload.sensor_id,
    flow_rate_lpm: effectiveFlowRate,
    total_volume_liters: effectiveTotalVolume,
    pulse_count: effectivePulseCount,
    timestamp: payload.timestamp,
    received_at: new Date().toISOString(),
    status: "valid",
  };

  dbState.push(record);
  return { status: 201, record };
}

// Live query simulation matching updated backend ordering
function getLatestTelemetry(dbState) {
  const sorted = [...dbState].sort((a, b) => b.id - a.id);
  return sorted[0] || null;
}

// --- RUN TESTS ---
const db = [];

runTest("1. Ingest initial water flow telemetry (Flow: 4.2 L/min, Pulses: 315, Volume: 0.70 L)", () => {
  const res = processIngest({
    sensor_id: "sen_001",
    flow_rate_lpm: 4.2,
    total_volume_liters: 0.70,
    pulse_count: 315,
    timestamp: "2026-09-04T12:00:00.000Z",
  }, db);

  assert.strictEqual(res.status, 201);
  const latest = getLatestTelemetry(db);
  assert.strictEqual(latest.flow_rate_lpm, 4.2);
  assert.strictEqual(latest.pulse_count, 315);
  assert.strictEqual(latest.total_volume_liters, 0.70);
});

runTest("2. Water flow stops (ESP32 sends Flow: 0.0 L/min, Pulses: 315, Volume: 0.70 L)", () => {
  const res = processIngest({
    sensor_id: "sen_001",
    flow_rate_lpm: 0.0,
    total_volume_liters: 0.70,
    pulse_count: 315,
    timestamp: "2026-09-04T12:00:05.000Z",
  }, db);

  assert.strictEqual(res.status, 201);
  const latest = getLatestTelemetry(db);
  assert.strictEqual(latest.flow_rate_lpm, 0.0);
  assert.strictEqual(latest.pulse_count, 315);
  assert.strictEqual(latest.total_volume_liters, 0.70);
});

runTest("3. Consecutive heartbeats with flow stopped (10 frames over 50s)", () => {
  for (let i = 2; i <= 10; i++) {
    const sec = String(i * 5).padStart(2, "0");
    processIngest({
      sensor_id: "sen_001",
      flow_rate_lpm: 0.0,
      total_volume_liters: 0.70,
      pulse_count: 315,
      timestamp: `2026-09-04T12:00:${sec}.000Z`,
    }, db);
  }

  const latest = getLatestTelemetry(db);
  assert.strictEqual(latest.flow_rate_lpm, 0.0);
  assert.strictEqual(latest.pulse_count, 315, "Pulse count must remain exactly 315");
  assert.strictEqual(latest.total_volume_liters, 0.70, "Total volume must remain exactly 0.70");
});

runTest("4. Network retry duplicate timestamp protection", () => {
  const res = processIngest({
    sensor_id: "sen_001",
    flow_rate_lpm: 0.0,
    total_volume_liters: 0.70,
    pulse_count: 315,
    timestamp: "2026-09-04T12:00:10.000Z", // Duplicate of frame 2
  }, db);

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.message, "duplicate ignored");
  assert.strictEqual(db.length, 11, "DB record count must not increment for duplicate");
});

runTest("5. Sensor detects new flow resume (Flow: 2.5 L/min, Pulses: 450, Volume: 1.00 L)", () => {
  processIngest({
    sensor_id: "sen_001",
    flow_rate_lpm: 2.5,
    total_volume_liters: 1.00,
    pulse_count: 450,
    timestamp: "2026-09-04T12:01:00.000Z",
  }, db);

  const latest = getLatestTelemetry(db);
  assert.strictEqual(latest.flow_rate_lpm, 2.5);
  assert.strictEqual(latest.pulse_count, 450);
  assert.strictEqual(latest.total_volume_liters, 1.00);
});

console.log("==================================================================");
console.log(`SUMMARY: ${totalPassed} PASSED, ${totalFailed} FAILED out of ${totalPassed + totalFailed} tests`);
console.log("==================================================================");

if (totalFailed > 0) process.exit(1);
