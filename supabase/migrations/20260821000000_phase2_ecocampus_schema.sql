-- EcoCampus AI Phase 2 Database Schema & Security Migration
-- Single Source of Truth: Backend Database Schema Document v1.0
-- Target Platform: PostgreSQL / Supabase

-- Enable OS Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==================================================
-- 1. CREATE CORE TABLES
-- ==================================================

-- 1.1 organizations
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 1.2 campuses
CREATE TABLE IF NOT EXISTS public.campuses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE RESTRICT,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 1.3 buildings
CREATE TABLE IF NOT EXISTS public.buildings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campus_id UUID NOT NULL REFERENCES public.campuses(id) ON DELETE RESTRICT,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 1.4 locations (supports self-referencing parent_location_id)
CREATE TABLE IF NOT EXISTS public.locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    building_id UUID NOT NULL REFERENCES public.buildings(id) ON DELETE RESTRICT,
    parent_location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    floor VARCHAR(50),
    location_type VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 1.5 devices
CREATE TABLE IF NOT EXISTS public.devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    location_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE RESTRICT,
    device_uid VARCHAR(100) UNIQUE NOT NULL,
    device_type VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'offline',
    api_key_hash TEXT,
    firmware_version VARCHAR(50),
    last_seen_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 1.6 sensors
CREATE TABLE IF NOT EXISTS public.sensors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id UUID NOT NULL REFERENCES public.devices(id) ON DELETE RESTRICT,
    sensor_type VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    calibration_factor DECIMAL DEFAULT 1.0,
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 1.7 telemetry (Time-series data, BIGSERIAL primary key)
CREATE TABLE IF NOT EXISTS public.telemetry (
    id BIGSERIAL PRIMARY KEY,
    sensor_id UUID NOT NULL REFERENCES public.sensors(id) ON DELETE RESTRICT,
    flow_rate_lpm DECIMAL(10, 2),
    total_volume_liters DECIMAL(12, 2),
    pulse_count BIGINT,
    timestamp TIMESTAMPTZ NOT NULL,
    received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status VARCHAR(50) NOT NULL DEFAULT 'valid'
);

-- 1.8 anomaly_events
CREATE TABLE IF NOT EXISTS public.anomaly_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sensor_id UUID NOT NULL REFERENCES public.sensors(id) ON DELETE RESTRICT,
    location_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE RESTRICT,
    anomaly_type VARCHAR(100) NOT NULL,
    rule_triggered VARCHAR(100) NOT NULL,
    severity VARCHAR(50) NOT NULL,
    detected_at TIMESTAMPTZ NOT NULL,
    evidence JSONB,
    status VARCHAR(50) NOT NULL DEFAULT 'active'
);

-- 1.9 alerts
CREATE TABLE IF NOT EXISTS public.alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE RESTRICT,
    location_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE RESTRICT,
    device_id UUID NOT NULL REFERENCES public.devices(id) ON DELETE RESTRICT,
    sensor_id UUID NOT NULL REFERENCES public.sensors(id) ON DELETE RESTRICT,
    anomaly_event_id UUID NOT NULL REFERENCES public.anomaly_events(id) ON DELETE RESTRICT,
    severity VARCHAR(50) NOT NULL,
    alert_type VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    detected_at TIMESTAMPTZ NOT NULL,
    resolved_at TIMESTAMPTZ,
    resolved_by UUID
);

-- 1.10 recommendations
CREATE TABLE IF NOT EXISTS public.recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alert_id UUID NOT NULL REFERENCES public.alerts(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    priority VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 1.11 users
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE RESTRICT,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==================================================
-- 2. CREATE INDEXES
-- ==================================================
CREATE INDEX IF NOT EXISTS idx_campuses_organization_id ON public.campuses(organization_id);
CREATE INDEX IF NOT EXISTS idx_buildings_campus_id ON public.buildings(campus_id);
CREATE INDEX IF NOT EXISTS idx_locations_building_id ON public.locations(building_id);
CREATE INDEX IF NOT EXISTS idx_locations_parent_location_id ON public.locations(parent_location_id);
CREATE INDEX IF NOT EXISTS idx_devices_location_id ON public.devices(location_id);
CREATE INDEX IF NOT EXISTS idx_devices_device_uid ON public.devices(device_uid);
CREATE INDEX IF NOT EXISTS idx_devices_status ON public.devices(status);
CREATE INDEX IF NOT EXISTS idx_sensors_device_id ON public.sensors(device_id);
CREATE INDEX IF NOT EXISTS idx_telemetry_sensor_id_timestamp ON public.telemetry(sensor_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_telemetry_timestamp ON public.telemetry(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_anomaly_events_sensor_detected ON public.anomaly_events(sensor_id, detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_org_status ON public.alerts(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_alerts_location_status ON public.alerts(location_id, status);
CREATE INDEX IF NOT EXISTS idx_alerts_detected_at ON public.alerts(detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_recommendations_alert_id ON public.recommendations(alert_id);
CREATE INDEX IF NOT EXISTS idx_users_organization_id ON public.users(organization_id);

-- ==================================================
-- 3. ENABLE ROW LEVEL SECURITY (RLS) & POLICIES
-- ==================================================
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buildings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sensors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telemetry ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anomaly_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Helper function to retrieve authenticated user's organization ID
CREATE OR REPLACE FUNCTION public.get_current_user_org_id()
RETURNS UUID AS $$
  SELECT organization_id FROM public.users WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- RLS Policies
CREATE POLICY org_isolation_organizations ON public.organizations
    FOR SELECT USING (id = public.get_current_user_org_id());

CREATE POLICY org_isolation_campuses ON public.campuses
    FOR SELECT USING (organization_id = public.get_current_user_org_id());

CREATE POLICY org_isolation_buildings ON public.buildings
    FOR SELECT USING (campus_id IN (SELECT id FROM public.campuses WHERE organization_id = public.get_current_user_org_id()));

CREATE POLICY org_isolation_locations ON public.locations
    FOR SELECT USING (building_id IN (
        SELECT b.id FROM public.buildings b
        JOIN public.campuses c ON b.campus_id = c.id
        WHERE c.organization_id = public.get_current_user_org_id()
    ));

CREATE POLICY org_isolation_devices ON public.devices
    FOR SELECT USING (location_id IN (
        SELECT l.id FROM public.locations l
        JOIN public.buildings b ON l.building_id = b.id
        JOIN public.campuses c ON b.campus_id = c.id
        WHERE c.organization_id = public.get_current_user_org_id()
    ));

CREATE POLICY org_isolation_sensors ON public.sensors
    FOR SELECT USING (device_id IN (
        SELECT d.id FROM public.devices d
        JOIN public.locations l ON d.location_id = l.id
        JOIN public.buildings b ON l.building_id = b.id
        JOIN public.campuses c ON b.campus_id = c.id
        WHERE c.organization_id = public.get_current_user_org_id()
    ));

CREATE POLICY org_isolation_telemetry ON public.telemetry
    FOR SELECT USING (sensor_id IN (
        SELECT s.id FROM public.sensors s
        JOIN public.devices d ON s.device_id = d.id
        JOIN public.locations l ON d.location_id = l.id
        JOIN public.buildings b ON l.building_id = b.id
        JOIN public.campuses c ON b.campus_id = c.id
        WHERE c.organization_id = public.get_current_user_org_id()
    ));

CREATE POLICY org_isolation_anomaly_events ON public.anomaly_events
    FOR SELECT USING (location_id IN (
        SELECT l.id FROM public.locations l
        JOIN public.buildings b ON l.building_id = b.id
        JOIN public.campuses c ON b.campus_id = c.id
        WHERE c.organization_id = public.get_current_user_org_id()
    ));

CREATE POLICY org_isolation_alerts ON public.alerts
    FOR SELECT USING (organization_id = public.get_current_user_org_id());

CREATE POLICY org_isolation_recommendations ON public.recommendations
    FOR SELECT USING (alert_id IN (
        SELECT id FROM public.alerts WHERE organization_id = public.get_current_user_org_id()
    ));

CREATE POLICY org_isolation_users ON public.users
    FOR SELECT USING (organization_id = public.get_current_user_org_id());
