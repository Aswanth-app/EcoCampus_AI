import http from "http";

async function fetchJson(url, options = {}) {
  const res = await fetch(url, options);
  const json = await res.json();
  return { status: res.status, json };
}

async function runVerification() {
  console.log("================================================================");
  console.log("   ECOCAMPUS AI — LIVE VS OFFLINE PIPELINE VERIFICATION         ");
  console.log("================================================================");

  const BASE_URL = "http://localhost:3000";

  // Step 1: Query live API in current state (offline if >120s since last test)
  console.log("\n[1] Checking /api/v1/telemetry/live response structure...");
  try {
    const { status, json } = await fetchJson(`${BASE_URL}/api/v1/telemetry/live`);
    console.log(`  HTTP Status: ${status}`);
    console.log(`  Success: ${json.success}`);
    console.log(`  is_online: ${json.data?.meta?.is_online}`);
    console.log(`  diff_seconds: ${json.data?.meta?.diff_seconds}s`);
    console.log(`  latest (active live reading):`, json.data?.latest);
    console.log(`  last_recorded (historical):`, json.data?.last_recorded ? `#${json.data.last_recorded.id} (${json.data.last_recorded.flow_rate_lpm} L/min)` : "None");

    if (!json.data?.meta?.is_online) {
      if (json.data?.latest === null) {
        console.log("  [PASS] Offline state correctly returns latest: null (preventing stale values from displaying as live)");
      } else {
        console.error("  [FAIL] Offline state should have latest: null!");
        process.exit(1);
      }
    }
  } catch (err) {
    console.error("  [ERROR] Failed to query /api/v1/telemetry/live:", err.message);
  }

  // Step 2: Ingest a fresh live reading to test transition to LIVE
  console.log("\n[2] Ingesting FRESH live telemetry record from ESP32...");
  const freshPayload = {
    device_id: "DEV_ESP32_001",
    sensor_id: "00000000-0000-4000-a000-000000000006",
    flow_rate_lpm: 3.25,
    total_volume_liters: 18.50,
    pulse_count: 8325,
    status: "normal",
    firmware_version: "v2.4.1",
    timestamp: new Date().toISOString(),
  };

  try {
    const ingestRes = await fetchJson(`${BASE_URL}/api/v1/telemetry/ingest`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Device-API-Key": "dev_secret_key_001",
      },
      body: JSON.stringify(freshPayload),
    });

    console.log(`  Ingest HTTP Status: ${ingestRes.status}`);
    console.log(`  Ingest Response:`, ingestRes.json);

    if (ingestRes.status === 201) {
      console.log("  [PASS] Telemetry successfully persisted to Supabase");
    }

    // Step 3: Verify /api/v1/telemetry/live now immediately reflects LIVE status
    console.log("\n[3] Verifying /api/v1/telemetry/live immediately after fresh ingestion...");
    const liveCheck = await fetchJson(`${BASE_URL}/api/v1/telemetry/live`);
    console.log(`  is_online: ${liveCheck.json?.data?.meta?.is_online}`);
    console.log(`  diff_seconds: ${liveCheck.json?.data?.meta?.diff_seconds}s`);
    console.log(`  Active Live Flow: ${liveCheck.json?.data?.latest?.flow_rate_lpm} L/min`);
    console.log(`  Active Live Volume: ${liveCheck.json?.data?.latest?.total_volume_liters} L`);

    if (liveCheck.json?.data?.meta?.is_online === true) {
      console.log("  [PASS] Heartbeat verified: Device is ONLINE");
    } else {
      console.error("  [FAIL] Device should be ONLINE after fresh ingestion!");
      process.exit(1);
    }

    if (Number(liveCheck.json?.data?.latest?.flow_rate_lpm) === 3.25) {
      console.log("  [PASS] Active live flow rate matches fresh reading (3.25 L/min)");
    } else {
      console.error("  [FAIL] Live flow rate does not match!");
      process.exit(1);
    }

    console.log("\n================================================================");
    console.log("  ALL PIPELINE VERIFICATION CHECKS PASSED SUCCESSFULLY!          ");
    console.log("================================================================");
  } catch (err) {
    console.error("  [ERROR] Ingest verification failed:", err.message);
  }
}

runVerification();
