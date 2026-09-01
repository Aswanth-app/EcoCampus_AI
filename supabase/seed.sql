-- EcoCampus AI Development Seed Data
-- Clearly identified as development-only seed data for testing Phase 2 database hierarchy.

DO $$
DECLARE
    v_org_id UUID := '00000000-0000-4000-a000-000000000001';
    v_campus_id UUID := '00000000-0000-4000-a000-000000000002';
    v_building_id UUID := '00000000-0000-4000-a000-000000000003';
    v_location_id UUID := '00000000-0000-4000-a000-000000000004';
    v_device_id UUID := '00000000-0000-4000-a000-000000000005';
    v_sensor_id UUID := '00000000-0000-4000-a000-000000000006';
    v_anomaly_id UUID := '00000000-0000-4000-a000-000000000007';
    v_alert_id UUID := '00000000-0000-4000-a000-000000000008';
    v_user_id UUID := '00000000-0000-4000-a000-000000000009';
BEGIN
    -- 1. Development Organization
    INSERT INTO public.organizations (id, name)
    VALUES (v_org_id, 'EcoCampus Demo Organization')
    ON CONFLICT (id) DO NOTHING;

    -- 2. Development Campus
    INSERT INTO public.campuses (id, organization_id, name, address)
    VALUES (v_campus_id, v_org_id, 'Main Campus', '100 Innovation Way, Silicon Valley, CA')
    ON CONFLICT (id) DO NOTHING;

    -- 3. Development Building
    INSERT INTO public.buildings (id, campus_id, name, code)
    VALUES (v_building_id, v_campus_id, 'Hostel Block A', 'HBA')
    ON CONFLICT (id) DO NOTHING;

    -- 4. Development Location
    INSERT INTO public.locations (id, building_id, name, floor, location_type)
    VALUES (v_location_id, v_building_id, 'Ground Floor Water Zone', 'Ground Floor', 'restroom')
    ON CONFLICT (id) DO NOTHING;

    -- 5. Development Device (storing secure hash for api_key_hash)
    INSERT INTO public.devices (id, location_id, device_uid, device_type, status, api_key_hash, firmware_version, last_seen_at)
    VALUES (v_device_id, v_location_id, 'DEV-ESP32-001', 'ESP32', 'online', 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', 'v2.4.1', NOW())
    ON CONFLICT (id) DO NOTHING;

    -- 6. Development Sensor
    INSERT INTO public.sensors (id, device_id, sensor_type, resource_type, unit, calibration_factor, status)
    VALUES (v_sensor_id, v_device_id, 'YF-S201', 'water', 'L/min', 7.5, 'active')
    ON CONFLICT (id) DO NOTHING;

    -- 7. Realistic Seed Telemetry Records
    INSERT INTO public.telemetry (sensor_id, flow_rate_lpm, total_volume_liters, pulse_count, timestamp, status)
    VALUES 
        (v_sensor_id, 12.5, 450.2, 560, NOW() - INTERVAL '30 minutes', 'valid'),
        (v_sensor_id, 16.8, 458.6, 750, NOW() - INTERVAL '20 minutes', 'valid'),
        (v_sensor_id, 16.8, 467.0, 940, NOW() - INTERVAL '10 minutes', 'valid'),
        (v_sensor_id, 16.8, 475.4, 1130, NOW(), 'valid');

    -- 8. Development Anomaly Event
    INSERT INTO public.anomaly_events (id, sensor_id, location_id, anomaly_type, rule_triggered, severity, detected_at, evidence, status)
    VALUES (v_anomaly_id, v_sensor_id, v_location_id, 'continuous_flow', 'off_peak_continuous_flow', 'high', NOW() - INTERVAL '15 minutes', '{"flow_rate_lpm": 16.8, "duration_minutes": 15}'::jsonb, 'active')
    ON CONFLICT (id) DO NOTHING;

    -- 9. Development Alert
    INSERT INTO public.alerts (id, organization_id, location_id, device_id, sensor_id, anomaly_event_id, severity, alert_type, message, status, detected_at)
    VALUES (v_alert_id, v_org_id, v_location_id, v_device_id, v_sensor_id, v_anomaly_id, 'critical', 'continuous_flow', 'Water has been flowing continuously at 16.8 L/min during off-peak hours.', 'pending', NOW() - INTERVAL '15 minutes')
    ON CONFLICT (id) DO NOTHING;

    -- 10. Development Recommendation
    INSERT INTO public.recommendations (alert_id, title, description, priority)
    VALUES (v_alert_id, 'Inspect Restroom Taps & Valves', 'Immediately dispatch maintenance to inspect flush valves and main line isolation taps.', 'high');

    -- 11. Development User
    INSERT INTO public.users (id, organization_id, name, email, role)
    VALUES (v_user_id, v_org_id, 'Alexander Vance', 'a.vance@ecoflux-univ.edu', 'facility_manager')
    ON CONFLICT (id) DO NOTHING;

END $$;
