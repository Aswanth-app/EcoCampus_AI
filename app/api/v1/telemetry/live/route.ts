import { NextResponse } from "next/server";
import { supabaseAdmin, isSupabaseAdminConfigured, supabase, isSupabaseConfigured } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const isDbActive = isSupabaseAdminConfigured || isSupabaseConfigured;
    const dbClient = isSupabaseAdminConfigured ? supabaseAdmin : supabase;

    if (!isDbActive) {
      return NextResponse.json(
        {
          success: false,
          error: "Supabase database client not configured",
        },
        { status: 503 }
      );
    }

    // 1. Fetch Registered ESP32 Device
    const { data: device, error: devErr } = await dbClient
      .from("devices")
      .select("id, device_uid, device_type, status, firmware_version, last_seen_at, created_at, location_id")
      .eq("device_uid", "DEV_ESP32_001")
      .maybeSingle();

    if (devErr) {
      console.error("Live telemetry device query error:", devErr.message);
    }

    // 2. Fetch Sensor attached to device
    let sensorData = null;
    if (device?.id) {
      const { data: sensor, error: senErr } = await dbClient
        .from("sensors")
        .select("id, device_id, sensor_type, resource_type, unit, calibration_factor, status")
        .eq("device_id", device.id)
        .maybeSingle();

      if (!senErr && sensor) {
        sensorData = sensor;
      }
    }

    // 3. Fetch Recent Telemetry History (last 30 records)
    const telemetryQuery = sensorData?.id
      ? dbClient
          .from("telemetry")
          .select("id, sensor_id, flow_rate_lpm, total_volume_liters, pulse_count, timestamp, received_at, status")
          .eq("sensor_id", sensorData.id)
          .order("id", { ascending: false })
          .limit(30)
      : dbClient
          .from("telemetry")
          .select("id, sensor_id, flow_rate_lpm, total_volume_liters, pulse_count, timestamp, received_at, status")
          .order("id", { ascending: false })
          .limit(30);

    const { data: historyList, error: telErr } = await telemetryQuery;

    if (telErr) {
      console.error("Live telemetry history query error:", telErr.message);
    }

    const latest = historyList && historyList.length > 0 ? historyList[0] : null;

    // 4. Calculate Online Status & Freshness
    let isOnline = false;
    let isLiveStreaming = false;

    if (device?.last_seen_at) {
      const lastSeenMs = new Date(device.last_seen_at).getTime();
      const nowMs = Date.now();
      const diffSeconds = Math.max(0, Math.floor((nowMs - lastSeenMs) / 1000));
      
      // Device is marked online if status is 'online' or seen within last 2 minutes
      isOnline = device.status === "online" || diffSeconds <= 120;
      isLiveStreaming = diffSeconds <= 30;
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          device: device || null,
          sensor: sensorData || null,
          latest: latest || null,
          history: historyList || [],
          meta: {
            total_records_returned: historyList ? historyList.length : 0,
            is_online: isOnline,
            is_live_streaming: isLiveStreaming,
            fetched_at: new Date().toISOString(),
          },
        },
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  } catch (error: any) {
    console.error("Live telemetry route error:", error?.message);
    return NextResponse.json(
      { success: false, error: "Internal server error fetching live telemetry" },
      { status: 500 }
    );
  }
}
