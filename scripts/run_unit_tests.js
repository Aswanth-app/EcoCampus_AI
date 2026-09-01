const { POST } = require('../app/api/v1/telemetry/ingest/route');

// Mock NextRequest for testing
function createMockRequest(headers, body, isMalformedJson = false) {
  return {
    headers: {
      get: (name) => {
        const lower = name.toLowerCase();
        for (const [k, v] of Object.entries(headers)) {
          if (k.toLowerCase() === lower) return v;
        }
        return null;
      }
    },
    json: async () => {
      if (isMalformedJson) {
        throw new Error("SyntaxError: Unexpected token in JSON");
      }
      return body;
    }
  };
}

async function runTests() {
  console.log("==================================================");
  console.log("ECOCAMPUS AI - TELEMETRY API IN-MEMORY TEST SUITE");
  console.log("==================================================");

  let passed = 0;
  let failed = 0;

  const scenarios = [
    {
      name: "1. Valid Telemetry Ingestion",
      headers: { "X-Device-API-Key": "dev_secret_key_001" },
      body: {
        device_id: "DEV_ESP32_001",
        sensor_id: "sen_w_001",
        flow_rate_lpm: 12.5,
        total_volume_liters: 450.2,
        pulse_count: 560,
        timestamp: "2026-08-21T16:30:00Z"
      },
      expectedStatus: 201
    },
    {
      name: "2. Missing API Key",
      headers: {},
      body: {
        device_id: "DEV_ESP32_001",
        sensor_id: "sen_w_001",
        flow_rate_lpm: 12.5,
        total_volume_liters: 450.2,
        pulse_count: 560,
        timestamp: "2026-08-21T16:30:00Z"
      },
      expectedStatus: 401
    },
    {
      name: "3. Invalid API Key",
      headers: { "X-Device-API-Key": "invalid_key_xyz" },
      body: {
        device_id: "DEV_ESP32_001",
        sensor_id: "sen_w_001",
        flow_rate_lpm: 12.5,
        total_volume_liters: 450.2,
        pulse_count: 560,
        timestamp: "2026-08-21T16:30:00Z"
      },
      expectedStatus: 401
    },
    {
      name: "4. Invalid Device ID",
      headers: { "X-Device-API-Key": "dev_secret_key_001" },
      body: {
        device_id: "DEV_UNKNOWN_999",
        sensor_id: "sen_w_001",
        flow_rate_lpm: 12.5,
        total_volume_liters: 450.2,
        pulse_count: 560,
        timestamp: "2026-08-21T16:30:00Z"
      },
      expectedStatus: 404
    },
    {
      name: "5. Invalid Sensor ID",
      headers: { "X-Device-API-Key": "dev_secret_key_001" },
      body: {
        device_id: "DEV_ESP32_001",
        sensor_id: "sen_unknown_999",
        flow_rate_lpm: 12.5,
        total_volume_liters: 450.2,
        pulse_count: 560,
        timestamp: "2026-08-21T16:30:00Z"
      },
      expectedStatus: 404
    },
    {
      name: "6. Device-Sensor Mismatch",
      headers: { "X-Device-API-Key": "dev_secret_key_001" },
      body: {
        device_id: "DEV_ESP32_001",
        sensor_id: "sen_w_002",
        flow_rate_lpm: 12.5,
        total_volume_liters: 450.2,
        pulse_count: 560,
        timestamp: "2026-08-21T16:30:00Z"
      },
      expectedStatus: 403
    },
    {
      name: "7. Inactive Device",
      headers: { "X-Device-API-Key": "dev_secret_key_004" },
      body: {
        device_id: "DEV_ESP32_INACTIVE",
        sensor_id: "sen_inactive_dev",
        flow_rate_lpm: 12.5,
        total_volume_liters: 450.2,
        pulse_count: 560,
        timestamp: "2026-08-21T16:30:00Z"
      },
      expectedStatus: 403
    },
    {
      name: "8. Inactive Sensor",
      headers: { "X-Device-API-Key": "dev_secret_key_001" },
      body: {
        device_id: "DEV_ESP32_001",
        sensor_id: "sen_inactive_001",
        flow_rate_lpm: 12.5,
        total_volume_liters: 450.2,
        pulse_count: 560,
        timestamp: "2026-08-21T16:30:00Z"
      },
      expectedStatus: 403
    },
    {
      name: "9. Invalid Flow Value (Negative)",
      headers: { "X-Device-API-Key": "dev_secret_key_001" },
      body: {
        device_id: "DEV_ESP32_001",
        sensor_id: "sen_w_001",
        flow_rate_lpm: -15.0,
        total_volume_liters: 450.2,
        pulse_count: 560,
        timestamp: "2026-08-21T16:30:00Z"
      },
      expectedStatus: 400
    },
    {
      name: "10. Negative Volume",
      headers: { "X-Device-API-Key": "dev_secret_key_001" },
      body: {
        device_id: "DEV_ESP32_001",
        sensor_id: "sen_w_001",
        flow_rate_lpm: 12.5,
        total_volume_liters: -450.2,
        pulse_count: 560,
        timestamp: "2026-08-21T16:30:00Z"
      },
      expectedStatus: 400
    },
    {
      name: "11. Invalid Pulse Count (Negative)",
      headers: { "X-Device-API-Key": "dev_secret_key_001" },
      body: {
        device_id: "DEV_ESP32_001",
        sensor_id: "sen_w_001",
        flow_rate_lpm: 12.5,
        total_volume_liters: 450.2,
        pulse_count: -10,
        timestamp: "2026-08-21T16:30:00Z"
      },
      expectedStatus: 400
    },
    {
      name: "12. Invalid ISO Timestamp",
      headers: { "X-Device-API-Key": "dev_secret_key_001" },
      body: {
        device_id: "DEV_ESP32_001",
        sensor_id: "sen_w_001",
        flow_rate_lpm: 12.5,
        total_volume_liters: 450.2,
        pulse_count: 560,
        timestamp: "INVALID_DATE"
      },
      expectedStatus: 400
    },
    {
      name: "13. Duplicate Telemetry (Same timestamp)",
      headers: { "X-Device-API-Key": "dev_secret_key_001" },
      body: {
        device_id: "DEV_ESP32_001",
        sensor_id: "sen_w_001",
        flow_rate_lpm: 12.5,
        total_volume_liters: 450.2,
        pulse_count: 560,
        timestamp: "2026-08-21T16:30:00Z"
      },
      expectedStatus: 200 // Idempotent 200 (duplicate ignored)
    },
    {
      name: "14. Malformed JSON Payload",
      headers: { "X-Device-API-Key": "dev_secret_key_001" },
      body: null,
      isMalformedJson: true,
      expectedStatus: 400
    },
    {
      name: "15. Device Heartbeat Verification",
      headers: { "X-Device-API-Key": "dev_secret_key_002" },
      body: {
        device_id: "DEV_ESP32_002",
        sensor_id: "sen_w_002",
        flow_rate_lpm: 8.4,
        total_volume_liters: 120.0,
        pulse_count: 210,
        timestamp: "2026-08-21T17:00:00Z"
      },
      expectedStatus: 201
    }
  ];

  for (const tc of scenarios) {
    try {
      const req = createMockRequest(tc.headers, tc.body, tc.isMalformedJson);
      const res = await POST(req);
      const status = res.status;
      const resBody = await res.json();

      if (status === tc.expectedStatus) {
        console.log(`[PASS] ${tc.name} -> HTTP ${status}`);
        passed++;
      } else {
        console.error(`[FAIL] ${tc.name} -> Expected HTTP ${tc.expectedStatus}, got ${status}. Response: ${JSON.stringify(resBody)}`);
        failed++;
      }
    } catch (e) {
      console.error(`[EXC] ${tc.name} -> Exception:`, e.message);
      failed++;
    }
  }

  console.log("--------------------------------------------------");
  console.log(`Test Results: ${passed} Passed, ${failed} Failed out of ${scenarios.length} scenarios.`);
  console.log("--------------------------------------------------");
}

runTests();

