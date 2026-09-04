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
      .or("device_uid.eq.DEV_ESP32_001,device_uid.eq.DEV-ESP32-001")
      .order("last_seen_at", { ascending: false, nullsFirst: false })
      .limit(1)
      .maybeSingle();

    if (devErr) {
      console.error("Live telemetry device query error:", devErr.message);
    }

    let resolvedDevice = device;
    if (!resolvedDevice) {
      const { data: anyDevice } = await dbClient
        .from("devices")
        .select("id, device_uid, device_type, status, firmware_version, last_seen_at, created_at, location_id")
        .order("last_seen_at", { ascending: false, nullsFirst: false })
        .limit(1)
        .maybeSingle();
      resolvedDevice = anyDevice;
    }

    // 2. Fetch Sensor attached to device
    let sensorData = null;
    if (resolvedDevice?.id) {
      const { data: sensor, error: senErr } = await dbClient
        .from("sensors")
        .select("id, device_id, sensor_type, resource_type, unit, calibration_factor, status")
        .eq("device_id", resolvedDevice.id)
        .maybeSingle();

      if (!senErr && sensor) {
        sensorData = sensor;
      }
    }

    if (!sensorData) {
      const { data: anySensor } = await dbClient
        .from("sensors")
        .select("id, device_id, sensor_type, resource_type, unit, calibration_factor, status")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (anySensor) {
        sensorData = anySensor;
      }
    }

    // 3. Fetch Recent Telemetry History (ordered by id DESC, timestamp DESC)
    const telemetryQuery = sensorData?.id
      ? dbClient
          .from("telemetry")
          .select("id, sensor_id, flow_rate_lpm, total_volume_liters, pulse_count, timestamp, received_at, status")
          .eq("sensor_id", sensorData.id)
          .order("id", { ascending: false })
          .order("timestamp", { ascending: false })
          .limit(30)
      : dbClient
          .from("telemetry")
          .select("id, sensor_id, flow_rate_lpm, total_volume_liters, pulse_count, timestamp, received_at, status")
          .order("id", { ascending: false })
          .order("timestamp", { ascending: false })
          .limit(30);

    const { data: historyList, error: telErr } = await telemetryQuery;

    if (telErr) {
      console.error("Live telemetry history query error:", telErr.message);
    }

    // Fetch total count of persisted telemetry records
    const { count: totalRecordCount } = await dbClient
      .from("telemetry")
      .select("*", { count: "exact", head: true });

    const latest = historyList && historyList.length > 0 ? historyList[0] : null;

    // 4. Calculate Online Status & Freshness (Strict 120s Heartbeat Rule)
    let isOnline = false;
    let isLiveStreaming = false;
    let diffSeconds = 999999;

    const latestActivityTimestamp = latest?.timestamp || latest?.received_at || resolvedDevice?.last_seen_at;

    if (latestActivityTimestamp) {
      const lastSeenMs = new Date(latestActivityTimestamp).getTime();
      const nowMs = Date.now();
      diffSeconds = Math.max(0, Math.floor((nowMs - lastSeenMs) / 1000));
      
      // Device is marked online STRICTLY if telemetry was seen within the last 120 seconds
      isOnline = diffSeconds <= 120;
      isLiveStreaming = diffSeconds <= 30;
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          device: resolvedDevice || null,
          sensor: sensorData || null,
          // latest represents ACTIVE live telemetry reading (null when offline/stale)
          latest: isOnline ? latest : null,
          // last_recorded is the newest historical record persisted in DB (for audit/stale reference)
          last_recorded: latest || null,
          history: historyList || [],
          meta: {
            total_records_returned: historyList ? historyList.length : 0,
            total_records_count: typeof totalRecordCount === "number" ? totalRecordCount : (historyList ? historyList.length : 0),
            is_online: isOnline,
            is_stale: !isOnline,
            is_live_streaming: isLiveStreaming,
            diff_seconds: diffSeconds,
            last_seen_at: latestActivityTimestamp || null,
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
