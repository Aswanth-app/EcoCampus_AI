/**
 * EcoCampus AI Supabase Database Type Definitions
 * Auto-generated / Structured database schema matching Phase 2 tables.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string;
          name: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      campuses: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          address: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          address?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          name?: string;
          address?: string | null;
          created_at?: string;
        };
      };
      buildings: {
        Row: {
          id: string;
          campus_id: string;
          name: string;
          code: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          campus_id: string;
          name: string;
          code?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          campus_id?: string;
          name?: string;
          code?: string | null;
          created_at?: string;
        };
      };
      locations: {
        Row: {
          id: string;
          building_id: string;
          parent_location_id: string | null;
          name: string;
          floor: string | null;
          location_type: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          building_id: string;
          parent_location_id?: string | null;
          name: string;
          floor?: string | null;
          location_type?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          building_id?: string;
          parent_location_id?: string | null;
          name?: string;
          floor?: string | null;
          location_type?: string | null;
          created_at?: string;
        };
      };
      devices: {
        Row: {
          id: string;
          location_id: string;
          device_uid: string;
          device_type: string;
          status: string;
          api_key_hash: string | null;
          firmware_version: string | null;
          last_seen_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          location_id: string;
          device_uid: string;
          device_type: string;
          status?: string;
          api_key_hash?: string | null;
          firmware_version?: string | null;
          last_seen_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          location_id?: string;
          device_uid?: string;
          device_type?: string;
          status?: string;
          api_key_hash?: string | null;
          firmware_version?: string | null;
          last_seen_at?: string | null;
          created_at?: string;
        };
      };
      sensors: {
        Row: {
          id: string;
          device_id: string;
          sensor_type: string;
          resource_type: string;
          unit: string;
          calibration_factor: number;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          device_id: string;
          sensor_type: string;
          resource_type: string;
          unit: string;
          calibration_factor?: number;
          status?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          device_id?: string;
          sensor_type?: string;
          resource_type?: string;
          unit?: string;
          calibration_factor?: number;
          status?: string;
          created_at?: string;
        };
      };
      telemetry: {
        Row: {
          id: number;
          sensor_id: string;
          flow_rate_lpm: number | null;
          total_volume_liters: number | null;
          pulse_count: number | null;
          timestamp: string;
          received_at: string;
          status: string;
        };
        Insert: {
          id?: number;
          sensor_id: string;
          flow_rate_lpm?: number | null;
          total_volume_liters?: number | null;
          pulse_count?: number | null;
          timestamp: string;
          received_at?: string;
          status?: string;
        };
        Update: {
          id?: number;
          sensor_id?: string;
          flow_rate_lpm?: number | null;
          total_volume_liters?: number | null;
          pulse_count?: number | null;
          timestamp?: string;
          received_at?: string;
          status?: string;
        };
      };
      anomaly_events: {
        Row: {
          id: string;
          sensor_id: string;
          location_id: string;
          anomaly_type: string;
          rule_triggered: string;
          severity: string;
          detected_at: string;
          evidence: Json | null;
          status: string;
        };
        Insert: {
          id?: string;
          sensor_id: string;
          location_id: string;
          anomaly_type: string;
          rule_triggered: string;
          severity: string;
          detected_at: string;
          evidence?: Json | null;
          status?: string;
        };
        Update: {
          id?: string;
          sensor_id?: string;
          location_id?: string;
          anomaly_type?: string;
          rule_triggered?: string;
          severity?: string;
          detected_at?: string;
          evidence?: Json | null;
          status?: string;
        };
      };
      alerts: {
        Row: {
          id: string;
          organization_id: string;
          location_id: string;
          device_id: string;
          sensor_id: string;
          anomaly_event_id: string;
          severity: string;
          alert_type: string;
          message: string;
          status: string;
          detected_at: string;
          resolved_at: string | null;
          resolved_by: string | null;
        };
        Insert: {
          id?: string;
          organization_id: string;
          location_id: string;
          device_id: string;
          sensor_id: string;
          anomaly_event_id: string;
          severity: string;
          alert_type: string;
          message: string;
          status?: string;
          detected_at: string;
          resolved_at?: string | null;
          resolved_by?: string | null;
        };
        Update: {
          id?: string;
          organization_id?: string;
          location_id?: string;
          device_id?: string;
          sensor_id?: string;
          anomaly_event_id?: string;
          severity?: string;
          alert_type?: string;
          message?: string;
          status?: string;
          detected_at?: string;
          resolved_at?: string | null;
          resolved_by?: string | null;
        };
      };
      recommendations: {
        Row: {
          id: string;
          alert_id: string;
          title: string;
          description: string;
          priority: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          alert_id: string;
          title: string;
          description: string;
          priority?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          alert_id?: string;
          title?: string;
          description?: string;
          priority?: string | null;
          created_at?: string;
        };
      };
      users: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          email: string;
          role: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          email: string;
          role: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          name?: string;
          email?: string;
          role?: string;
          created_at?: string;
        };
      };
    };
  };
}
