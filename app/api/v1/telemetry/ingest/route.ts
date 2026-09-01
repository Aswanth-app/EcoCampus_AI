import { NextRequest, NextResponse } from "next/server";
import { hashDeviceApiKey, safeHashCompare } from "@/lib/security";
import {
  supabaseAdmin,
  isSupabaseAdminConfigured,
  isSupabaseConfigured,
} from "@/lib/supabase";
import { MOCK_DEVICES, MOCK_SENSORS } from "@/data/mock-data";

export interface TelemetryIngestPayload {
  device_id: string;
  sensor_id: string;
  flow_rate_lpm: number;
  total_volume_liters: number;
  pulse_count: number;
  timestamp: string;
}

// In-memory store for duplicate protection fallback in test/mock mode
const devProcessedTelemetry = new Set<string>();

export async function POST(request: NextRequest) {
  try {
    // 1. Extract X-Device-API-Key Header
    const apiKey =
      request.headers.get("x-device-api-key") ||
      request.headers.get("X-Device-API-Key");

    if (!apiKey || typeof apiKey !== "string" || !apiKey.trim()) {
      return NextResponse.json(
        { success: false, error: "Missing or empty X-Device-API-Key header" },
        { status: 401 }
      );
    }

    // 2. Parse JSON Body securely
    let body: Partial<TelemetryIngestPayload>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid or malformed JSON payload" },
        { status: 400 }
      );
    }

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json(
        { success: false, error: "JSON payload must be an object" },
        { status: 400 }
      );
    }

    const {
      device_id,
      sensor_id,
      flow_rate_lpm,
      total_volume_liters,
      pulse_count,
      timestamp,
    } = body;

    // 3. Strict Input Validation & Type Enforcement
    if (!device_id || typeof device_id !== "string" || !device_id.trim()) {
      return NextResponse.json(
        { success: false, error: "Missing or invalid device_id" },
        { status: 400 }
      );
    }

    if (!sensor_id || typeof sensor_id !== "string" || !sensor_id.trim()) {
      return NextResponse.json(
        { success: false, error: "Missing or invalid sensor_id" },
        { status: 400 }
      );
    }

    if (
      typeof flow_rate_lpm !== "number" ||
      isNaN(flow_rate_lpm) ||
      !isFinite(flow_rate_lpm) ||
      flow_rate_lpm < 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "flow_rate_lpm must be a non-negative numeric value",
        },
        { status: 400 }
      );
    }

    if (
      typeof total_volume_liters !== "number" ||
      isNaN(total_volume_liters) ||
      !isFinite(total_volume_liters) ||
      total_volume_liters < 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "total_volume_liters must be a non-negative numeric value",
        },
        { status: 400 }
      );
    }

    if (
      typeof pulse_count !== "number" ||
      isNaN(pulse_count) ||
      !isFinite(pulse_count) ||
      pulse_count < 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "pulse_count must be a non-negative numeric value",
        },
        { status: 400 }
      );
    }

    if (
      !timestamp ||
      typeof timestamp !== "string" ||
      isNaN(Date.parse(timestamp))
    ) {
      return NextResponse.json(
        { success: false, error: "Invalid ISO-8601 timestamp format" },
        { status: 400 }
      );
    }

    const formattedTimestamp = new Date(timestamp).toISOString();
    const incomingKeyHash = hashDeviceApiKey(apiKey);

    // 4. Device Lookup & Key Verification
    let deviceData: {
      id: string;
      device_uid: string;
      location_id: string;
      status: string;
      api_key_hash?: string | null;
    } | null = null;

    let sensorData: {
      id: string;
      device_id: string;
      status: string;
    } | null = null;

    const isDbActive = isSupabaseAdminConfigured || isSupabaseConfigured;

    if (isDbActive) {
      // Query Supabase for Device using Admin client (bypasses RLS)
      const isUuid =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          device_id
        );

      const deviceQuery = supabaseAdmin
        .from("devices")
        .select("id, device_uid, location_id, status, api_key_hash");

      const { data: dbDevice, error: devErr } = isUuid
        ? await deviceQuery.or(`id.eq.${device_id},device_uid.eq.${device_id}`).maybeSingle()
        : await deviceQuery.eq("device_uid", device_id).maybeSingle();

      if (devErr || !dbDevice) {
        return NextResponse.json(
          { success: false, error: `Device '${device_id}' not found` },
          { status: 404 }
        );
      }
      deviceData = dbDevice;

      // Query Supabase for Sensor using Admin client
      const { data: dbSensor, error: senErr } = await supabaseAdmin
        .from("sensors")
        .select("id, device_id, status")
        .eq("id", sensor_id)
        .maybeSingle();

      if (senErr || !dbSensor) {
        return NextResponse.json(
          { success: false, error: `Sensor '${sensor_id}' not found` },
          { status: 404 }
        );
      }
      sensorData = dbSensor;
    } else {
      // Development / Test Mock Registry Fallback
      const mockDev = MOCK_DEVICES.find(
        (d) => d.deviceUid === device_id || d.id === device_id
      );

      if (!mockDev) {
        return NextResponse.json(
          { success: false, error: `Device '${device_id}' not found` },
          { status: 404 }
        );
      }

      // Default mock API key hashes
      const mockKeyHash =
        device_id === "DEV_ESP32_002"
          ? hashDeviceApiKey("dev_secret_key_002")
          : device_id === "DEV_ESP32_INACTIVE"
          ? hashDeviceApiKey("dev_secret_key_004")
          : hashDeviceApiKey("dev_secret_key_001");

      deviceData = {
        id: mockDev.id,
        device_uid: mockDev.deviceUid,
        location_id: mockDev.locationId,
        status: mockDev.status,
        api_key_hash: mockKeyHash,
      };

      const mockSen = MOCK_SENSORS.find((s) => s.id === sensor_id);

      if (!mockSen) {
        return NextResponse.json(
          { success: false, error: `Sensor '${sensor_id}' not found` },
          { status: 404 }
        );
      }

      sensorData = {
        id: mockSen.id,
        device_id: mockSen.deviceId,
        status: mockSen.status,
      };
    }

    // 5. Authentication & Authorization Enforcement
    // 5.1 Device Status Check
    if (deviceData.status === "inactive") {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Device is inactive" },
        { status: 403 }
      );
    }

    // 5.2 Sensor Status Check
    if (sensorData.status !== "active") {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Sensor is inactive" },
        { status: 403 }
      );
    }

    // 5.3 Device-Sensor Relationship Authorization
    if (sensorData.device_id !== deviceData.id) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized: Sensor does not belong to specified device",
        },
        { status: 403 }
      );
    }

    // 5.4 Device API Key Authentication Verification
    if (deviceData.api_key_hash) {
      const isValid = safeHashCompare(incomingKeyHash, deviceData.api_key_hash);
      if (!isValid) {
        return NextResponse.json(
          { success: false, error: "Invalid device API key credential" },
          { status: 401 }
        );
      }
    }

    // 6. Duplicate Telemetry Protection (Idempotency)
    const duplicateKey = `${sensorData.id}_${formattedTimestamp}`;

    if (isDbActive) {
      const { data: existingRecord } = await supabaseAdmin
        .from("telemetry")
        .select("id")
        .eq("sensor_id", sensorData.id)
        .eq("timestamp", formattedTimestamp)
        .maybeSingle();

      if (existingRecord) {
        // Idempotent acceptance without duplicate DB insertion
        return NextResponse.json(
          { success: true, message: "Telemetry accepted (duplicate ignored)" },
          { status: 200 }
        );
      }

      // 7. Database Telemetry Insertion using Admin client
      const { error: insertErr } = await supabaseAdmin.from("telemetry").insert({
        sensor_id: sensorData.id,
        flow_rate_lpm: flow_rate_lpm,
        total_volume_liters: total_volume_liters,
        pulse_count: Math.floor(pulse_count),
        timestamp: formattedTimestamp,
        received_at: new Date().toISOString(),
        status: "valid",
      });

      if (insertErr) {
        console.error("Telemetry insertion error:", insertErr.message);
        return NextResponse.json(
          { success: false, error: "Database telemetry storage failure" },
          { status: 500 }
        );
      }

      // 8. Device Heartbeat Update using Admin client
      await supabaseAdmin
        .from("devices")
        .update({
          last_seen_at: new Date().toISOString(),
          status: "online",
        })
        .eq("id", deviceData.id);
    } else {
      // Mock / In-memory duplicate protection check
      if (devProcessedTelemetry.has(duplicateKey)) {
        return NextResponse.json(
          { success: true, message: "Telemetry accepted (duplicate ignored)" },
          { status: 200 }
        );
      }
      devProcessedTelemetry.add(duplicateKey);
    }

    // 9. Return Standardized Machine Response
    return NextResponse.json(
      {
        success: true,
        message: "Telemetry accepted",
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Unexpected telemetry ingestion exception:", error?.message);
    return NextResponse.json(
      { success: false, error: "Unexpected server error" },
      { status: 500 }
    );
  }
}

