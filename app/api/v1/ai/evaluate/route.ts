import { NextRequest, NextResponse } from "next/server";
import {
  supabaseAdmin,
  isSupabaseAdminConfigured,
  supabase,
  isSupabaseConfigured,
} from "@/lib/supabase";
import { MOCK_DEVICES, MOCK_SENSORS } from "@/data/mock-data";
import { NormalizedTelemetry, WaterAnalysisResult } from "@/types";
import { evaluateWaterTelemetry } from "@/lib/ai/water-engine";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// In-memory idempotency set for dev/test fallback
const devProcessedAnomalyDeduplication = new Set<string>();

interface EvaluationRequestBody {
  sensor_id?: string;
  device_id?: string;
  simulated_telemetry?: NormalizedTelemetry;
  persist?: boolean;
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const sensorId = url.searchParams.get("sensor_id") || "00000000-0000-4000-a000-000000000006";
    const persist = url.searchParams.get("persist") === "true";

    const result = await runEvaluationPipeline({
      sensor_id: sensorId,
      persist,
    });

    return NextResponse.json(
      {
        success: true,
        data: result,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("AI Evaluation GET error:", error?.message);
    return NextResponse.json(
      { success: false, error: error?.message || "AI Evaluation failed" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    let body: EvaluationRequestBody = {};
    try {
      body = await request.json();
    } catch {
      // Empty body is acceptable; defaults to latest registered sensor
    }

    const result = await runEvaluationPipeline(body);

    return NextResponse.json(
      {
        success: true,
        data: result,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("AI Evaluation POST error:", error?.message);
    return NextResponse.json(
      { success: false, error: error?.message || "AI Evaluation failed" },
      { status: 500 }
    );
  }
}

/**
 * Pipeline helper to fetch context, execute Water AI Engine, and persist anomalies idempotently.
 */
async function runEvaluationPipeline(params: EvaluationRequestBody): Promise<WaterAnalysisResult> {
  const isDbActive = isSupabaseAdminConfigured || isSupabaseConfigured;
  const dbClient = isSupabaseAdminConfigured ? supabaseAdmin : supabase;

  // 1. Determine target sensor and device
  let targetSensorId = params.sensor_id || "00000000-0000-4000-a000-000000000006";
  let targetDeviceId = params.device_id || "DEV_ESP32_001";
  let locationName = "Hostel Block A — Ground Floor Restroom";
  let locationType = "restroom";
  let organizationId = "00000000-0000-4000-a000-000000000001";
  let locationId = "00000000-0000-4000-a000-000000000004";
  let deviceDbId = "00000000-0000-4000-a000-000000000005";

  let currentReading: NormalizedTelemetry;
  let recentWindow: NormalizedTelemetry[] = [];
  let baselineHistory: NormalizedTelemetry[] = [];

  if (params.simulated_telemetry) {
    // Mode A: Direct simulated telemetry evaluation (for automated tests / dry-runs)
    currentReading = params.simulated_telemetry;
    recentWindow = [currentReading];
  } else if (isDbActive) {
    // Mode B: Query live Supabase database for the sensor & telemetry
    const { data: dbSensor } = await dbClient
      .from("sensors")
      .select("id, device_id, sensor_type")
      .eq("id", targetSensorId)
      .maybeSingle();

    if (dbSensor) {
      targetSensorId = dbSensor.id;

      const { data: dbDevice } = await dbClient
        .from("devices")
        .select("id, device_uid, location_id")
        .eq("id", dbSensor.device_id)
        .maybeSingle();

      if (dbDevice) {
        targetDeviceId = dbDevice.device_uid;
        deviceDbId = dbDevice.id;
        if (dbDevice.location_id) locationId = dbDevice.location_id;
      }
    }

    // Query recent telemetry window (last 30 records)
    const { data: dbTelemetry } = await dbClient
      .from("telemetry")
      .select("sensor_id, flow_rate_lpm, total_volume_liters, pulse_count, timestamp")
      .eq("sensor_id", targetSensorId)
      .order("id", { ascending: false })
      .limit(30);

    if (dbTelemetry && dbTelemetry.length > 0) {
      const formatted: NormalizedTelemetry[] = dbTelemetry.map((t) => ({
        sensor_id: t.sensor_id,
        device_id: targetDeviceId,
        flow_rate_lpm: Number(t.flow_rate_lpm) || 0,
        total_volume_liters: Number(t.total_volume_liters) || 0,
        pulse_count: t.pulse_count ? Number(t.pulse_count) : 0,
        timestamp: t.timestamp,
      }));

      currentReading = formatted[0];
      recentWindow = [...formatted].reverse(); // chronological
      baselineHistory = formatted;
    } else {
      // Fallback if no records in DB yet
      currentReading = {
        sensor_id: targetSensorId,
        device_id: targetDeviceId,
        flow_rate_lpm: 0,
        total_volume_liters: 0,
        timestamp: new Date().toISOString(),
      };
    }
  } else {
    // Mode C: Mock data fallback
    currentReading = {
      sensor_id: targetSensorId,
      device_id: targetDeviceId,
      flow_rate_lpm: 12.5,
      total_volume_liters: 450.2,
      pulse_count: 560,
      timestamp: new Date().toISOString(),
    };
    recentWindow = [currentReading];
  }

  // 2. Execute Water Intelligence Engine
  const analysisResult = evaluateWaterTelemetry({
    currentReading,
    recentWindow,
    baselineHistory,
    locationType,
    locationName,
  });

  // 3. Idempotent Persistence (if requested and an anomaly was detected)
  const shouldPersist = params.persist !== false && analysisResult.isAnomaly;

  if (shouldPersist && analysisResult.anomalies.length > 0) {
    const primary = analysisResult.anomalies[0];
    const deduplicationKey = `${analysisResult.sensorId}_${primary.type}_${analysisResult.timestamp}`;

    if (isDbActive && isSupabaseAdminConfigured) {
      // Supabase Idempotency Check
      const { data: existingAnomaly } = await supabaseAdmin
        .from("anomaly_events")
        .select("id")
        .eq("sensor_id", targetSensorId)
        .eq("anomaly_type", primary.type)
        .eq("detected_at", primary.detectedAt)
        .maybeSingle();

      if (!existingAnomaly) {
        // Insert anomaly_event
        const { data: newAnomaly, error: aErr } = await supabaseAdmin
          .from("anomaly_events")
          .insert({
            sensor_id: targetSensorId,
            location_id: locationId,
            anomaly_type: primary.type,
            rule_triggered: primary.ruleTriggered,
            severity: primary.severity,
            detected_at: primary.detectedAt,
            evidence: primary.evidence,
            status: "active",
          })
          .select("id")
          .single();

        if (!aErr && newAnomaly) {
          // Insert alert
          const { data: newAlert, error: alErr } = await supabaseAdmin
            .from("alerts")
            .insert({
              organization_id: organizationId,
              location_id: locationId,
              device_id: deviceDbId,
              sensor_id: targetSensorId,
              anomaly_event_id: newAnomaly.id,
              severity: primary.severity,
              alert_type: primary.type,
              message: primary.explanation,
              status: "pending",
              detected_at: primary.detectedAt,
            })
            .select("id")
            .single();

          if (!alErr && newAlert && primary.recommendation) {
            // Insert recommendation
            await supabaseAdmin.from("recommendations").insert({
              alert_id: newAlert.id,
              title: primary.recommendation.title,
              description: primary.recommendation.description,
              priority: primary.recommendation.priority,
            });
          }
        }
      }
    } else {
      // In-memory Deduplication Check for Mock Mode
      devProcessedAnomalyDeduplication.add(deduplicationKey);
    }
  }

  return analysisResult;
}
