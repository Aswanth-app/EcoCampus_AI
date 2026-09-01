import { POST } from "../app/api/v1/telemetry/ingest/route.ts";

function createMockRequest(headers, body) {
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
    json: async () => body
  };
}

async function run() {
  console.log("==================================================");
  console.log("TESTING API ROUTE: /api/v1/telemetry/ingest");
  console.log("==================================================");

  const req1 = createMockRequest(
    { "X-Device-API-Key": "dev_secret_key_001" },
    {
      device_id: "DEV_ESP32_001",
      sensor_id: "sen_w_001",
      flow_rate_lpm: 12.5,
      total_volume_liters: 450.2,
      pulse_count: 560,
      timestamp: "2026-08-21T16:30:00Z"
    }
  );

  const res1 = await POST(req1);
  const data1 = await res1.json();
  console.log("1. Valid Telemetry Ingestion Result:", res1.status, data1);

  const req2 = createMockRequest({}, { device_id: "DEV_ESP32_001" });
  const res2 = await POST(req2);
  const data2 = await res2.json();
  console.log("2. Missing API Key Result:", res2.status, data2);

  const req3 = createMockRequest(
    { "X-Device-API-Key": "dev_secret_key_001" },
    {
      device_id: "DEV_ESP32_001",
      sensor_id: "sen_w_001",
      flow_rate_lpm: -5.0, // Invalid negative
      total_volume_liters: 450.2,
      timestamp: "2026-08-21T16:30:00Z"
    }
  );
  const res3 = await POST(req3);
  const data3 = await res3.json();
  console.log("3. Negative Flow Rate Result:", res3.status, data3);
}

run().catch(console.error);
