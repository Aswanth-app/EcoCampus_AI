import { NextRequest, NextResponse } from "next/server";
import {
  hashDeviceApiKey,
  safeHashCompare,
  checkRateLimit,
  validateTelemetryPayload,
} from "@/lib/security";
import { recordSecurityEvent } from "@/lib/security-events";
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
  const clientIp =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "client_local";

  try {
    // 1. Rate Limiting Check (30 requests/min per client IP)
    const rateLimit = checkRateLimit(clientIp, 30, 60 * 1000);
    if (!rateLimit.allowed) {
      recordSecurityEvent({
        eventType: "rate_limit_triggered",
        severity: "warning",
        source: "POST /api/v1/telemetry/ingest",
        message: `Rate limit threshold exceeded (${rateLimit.current} requests in current window)`,
        details: { client_ip: clientIp, reset_in_ms: rateLimit.resetMs },
      });

      return NextResponse.json(
        {
          success: false,
          error: "Rate limit exceeded. Maximum 30 requests per minute.",
        },
        {
          status: 429,
          headers: {
            "Retry-After": Math.ceil(rateLimit.resetMs / 1000).toString(),
            "X-RateLimit-Limit": "30",
            "X-RateLimit-Remaining": "0",
          },
        }
      );
    }

    // 2. Extract X-Device-API-Key Header
    const apiKey =
      request.headers.get("x-device-api-key") ||
      request.headers.get("X-Device-API-Key");

    if (!apiKey || typeof apiKey !== "string" || !apiKey.trim()) {
      recordSecurityEvent({
        eventType: "auth_failed",
        severity: "critical",
        source: "POST /api/v1/telemetry/ingest",
        message: "API authentication rejected: Missing or empty X-Device-API-Key header",
        details: { client_ip: clientIp },
      });

      return NextResponse.json(
        { success: false, error: "Missing or empty X-Device-API-Key header" },
        { status: 401 }
      );
    }

    // 3. Parse JSON Body securely
    let body: any;
    try {
      body = await request.json();
    } catch {
      recordSecurityEvent({
        eventType: "payload_invalid",
        severity: "warning",
        source: "POST /api/v1/telemetry/ingest",
        message: "Telemetry ingestion rejected: Malformed JSON payload",
        details: { client_ip: clientIp },
      });

      return NextResponse.json(
        { success: false, error: "Invalid or malformed JSON payload" },
        { status: 400 }
      );
    }

    // 4. Strict Input Validation & Boundary Enforcement
    const validation = validateTelemetryPayload(body);
    if (!validation.valid || !validation.sanitized) {
      recordSecurityEvent({
        eventType: "payload_invalid",
        severity: "warning",
        source: "POST /api/v1/telemetry/ingest",
        deviceUid: typeof body?.device_id === "string" ? body.device_id : undefined,
        message: `Telemetry payload rejected: ${validation.error}`,
        details: { client_ip: clientIp, error_reason: validation.error || "validation_error" },
      });

      return NextResponse.json(
        { success: false, error: validation.error || "Invalid telemetry payload" },
        { status: 400 }
      );
    }

    const {
      device_id,
      sensor_id,
    } = body;
    const {
      flow_rate_lpm,
      total_volume_liters,
      pulse_count,
      timestamp: formattedTimestamp,
    } = validation.sanitized;

    const incomingKeyHash = hashDeviceApiKey(apiKey);

    // 5. Device Lookup & Key Verification
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
        recordSecurityEvent({
          eventType: "unauthorized_device",
          severity: "critical",
          source: "POST /api/v1/telemetry/ingest",
          deviceUid: device_id,
          message: `Device '${device_id}' unregistered or not found in registry`,
          details: { client_ip: clientIp },
        });

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
        recordSecurityEvent({
          eventType: "unauthorized_device",
          severity: "critical",
          source: "POST /api/v1/telemetry/ingest",
          deviceUid: device_id,
          message: `Sensor '${sensor_id}' unregistered or not found`,
          details: { client_ip: clientIp },
        });

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
        recordSecurityEvent({
          eventType: "unauthorized_device",
          severity: "critical",
          source: "POST /api/v1/telemetry/ingest",
          deviceUid: device_id,
          message: `Device '${device_id}' not found in mock registry`,
          details: { client_ip: clientIp },
        });

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
        recordSecurityEvent({
          eventType: "unauthorized_device",
          severity: "critical",
          source: "POST /api/v1/telemetry/ingest",
          deviceUid: device_id,
          message: `Sensor '${sensor_id}' not found in mock registry`,
          details: { client_ip: clientIp },
        });

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

    // 6. Authentication & Authorization Enforcement
    // 6.1 Device Status Check
    if (deviceData.status === "inactive") {
      recordSecurityEvent({
        eventType: "unauthorized_device",
        severity: "critical",
        source: "POST /api/v1/telemetry/ingest",
        deviceUid: deviceData.device_uid,
        message: `Unauthorized attempt from inactive device '${deviceData.device_uid}'`,
        details: { client_ip: clientIp, device_status: deviceData.status },
      });

      return NextResponse.json(
        { success: false, error: "Unauthorized: Device is inactive" },
        { status: 403 }
      );
    }

    // 6.2 Sensor Status Check
    if (sensorData.status !== "active") {
      recordSecurityEvent({
        eventType: "unauthorized_device",
        severity: "critical",
        source: "POST /api/v1/telemetry/ingest",
        deviceUid: deviceData.device_uid,
        message: `Unauthorized attempt with inactive sensor '${sensorData.id}'`,
        details: { client_ip: clientIp, sensor_status: sensorData.status },
      });

      return NextResponse.json(
        { success: false, error: "Unauthorized: Sensor is inactive" },
        { status: 403 }
      );
    }

    // 6.3 Device-Sensor Relationship Authorization
    if (sensorData.device_id !== deviceData.id) {
      recordSecurityEvent({
        eventType: "unauthorized_device",
        severity: "critical",
        source: "POST /api/v1/telemetry/ingest",
        deviceUid: deviceData.device_uid,
        message: `Authorization violation: Sensor '${sensorData.id}' is not mapped to device '${deviceData.device_uid}'`,
        details: { client_ip: clientIp },
      });

      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized: Sensor does not belong to specified device",
        },
        { status: 403 }
      );
    }

    // 6.4 Device API Key Authentication Verification (Timing-safe comparison)
    if (deviceData.api_key_hash) {
      const isValid = safeHashCompare(incomingKeyHash, deviceData.api_key_hash);
      if (!isValid) {
        recordSecurityEvent({
          eventType: "auth_failed",
          severity: "critical",
          source: "POST /api/v1/telemetry/ingest",
          deviceUid: deviceData.device_uid,
          message: `Authentication failed for device '${deviceData.device_uid}': Invalid cryptographic key hash`,
          details: { client_ip: clientIp },
        });

        return NextResponse.json(
          { success: false, error: "Invalid device API key credential" },
          { status: 401 }
        );
      }
    }

    // 7. Duplicate Telemetry Protection (Idempotency)
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

      // 8. Store Direct Sensor Telemetry Reading (Preserving exact ESP32 hardware values)
      const effectivePulseCount = pulse_count;
      const effectiveTotalVolume = total_volume_liters;
      const effectiveFlowRate = flow_rate_lpm;

      // 9. Database Telemetry Insertion using Admin client
      const { error: insertErr } = await supabaseAdmin.from("telemetry").insert({
        sensor_id: sensorData.id,
        flow_rate_lpm: effectiveFlowRate,
        total_volume_liters: effectiveTotalVolume,
        pulse_count: effectivePulseCount,
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

      // 10. Device Heartbeat Update using Admin client
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

    // 11. Record Successful Authentication & Telemetry Ingest Event
    recordSecurityEvent({
      eventType: "auth_success",
      severity: "info",
      source: "POST /api/v1/telemetry/ingest",
      deviceUid: deviceData.device_uid,
      message: `Verified telemetry received from ${deviceData.device_uid} (${flow_rate_lpm} L/min, ${total_volume_liters} L)`,
      details: {
        flow_rate_lpm,
        pulse_count,
        total_volume_liters,
        client_ip: clientIp,
      },
    });

    // 12. Return Standardized Machine Response
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


