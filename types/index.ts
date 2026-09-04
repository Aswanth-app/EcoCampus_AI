/**
 * EcoCampus AI Type Definitions
 * Designed to strictly follow the locked multi-tenant data hierarchy:
 * Organization -> Campus -> Building -> Location -> Device -> Sensor -> Telemetry
 */

export type UserRole = "organization_admin" | "facility_manager" | "viewer";

export interface User {
  id: string;
  organizationId: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  createdAt: string;
}

export interface Organization {
  id: string;
  name: string;
  code: string;
  campusesCount: number;
  totalBuildings: number;
  totalDevices: number;
  createdAt: string;
}

export interface Campus {
  id: string;
  organizationId: string;
  name: string;
  address: string;
  buildingsCount: number;
  devicesCount: number;
  waterUsageTodayLiters: number;
  activeAlertsCount: number;
  status: "normal" | "warning" | "critical";
}

export interface Building {
  id: string;
  campusId: string;
  campusName: string;
  name: string;
  code: string;
  locationsCount: number;
  devicesCount: number;
  devicesOnlineCount: number;
  waterUsageTodayLiters: number;
  waterUsageYesterdayLiters: number;
  currentFlowLpm: number;
  status: "normal" | "warning" | "critical" | "offline";
  activeAlertsCount: number;
  isLiveNode?: boolean;
  simulationLabel?: string;
}

export interface Location {
  id: string;
  buildingId: string;
  buildingName: string;
  parentLocationId?: string;
  name: string;
  floor: string;
  locationType: "restroom" | "hostel_block" | "pipeline_zone" | "utility_area" | "tank_area" | "cafeteria";
  devicesCount: number;
  currentFlowLpm: number;
  waterUsageTodayLiters: number;
  status: "normal" | "warning" | "critical" | "offline";
}

export type DeviceStatus = "online" | "offline" | "inactive";

export interface Device {
  id: string;
  deviceUid: string;
  locationId: string;
  locationName: string;
  buildingName: string;
  campusName: string;
  deviceType: "ESP32";
  status: DeviceStatus;
  firmwareVersion: string;
  lastSeenAt: string;
  sensorsCount: number;
  registeredAt: string;
}

export type ResourceType = "water" | "electricity" | "gas" | "waste" | "environment";
export type SensorType = "YF-S201" | "power_meter" | "gas_meter";

export interface Sensor {
  id: string;
  deviceId: string;
  sensorType: SensorType;
  resourceType: ResourceType;
  unit: string; // e.g. "L/min"
  calibrationFactor: number;
  status: "active" | "inactive";
  createdAt: string;
}

export interface Telemetry {
  id: string;
  sensorId: string;
  flowRateLpm: number;
  totalVolumeLiters: number;
  pulseCount: number;
  timestamp: string;
  receivedAt: string;
  status: "valid" | "glitch" | "invalid";
}

export type AlertSeverity = "critical" | "warning" | "info";
export type AlertStatus = "pending" | "investigating" | "resolved";

export interface Alert {
  id: string;
  organizationId: string;
  campusId: string;
  buildingId: string;
  locationId: string;
  deviceId: string;
  sensorId: string;
  anomalyEventId: string;
  severity: AlertSeverity;
  alertType: "continuous_flow" | "critical_high_flow" | "device_offline" | "unusual_off_peak";
  title: string;
  message: string;
  buildingName: string;
  locationName: string;
  deviceUid: string;
  currentFlowLpm: number;
  durationMinutes: number;
  status: AlertStatus;
  detectedAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
  recommendationTitle: string;
  recommendationDescription: string;
  isLiveAlert?: boolean;
  isHistoricalDemo?: boolean;
}

export interface Insight {
  id: string;
  title: string;
  buildingName: string;
  locationName: string;
  avoidableVolumeLiters: number;
  recommendedAction: string;
  severity: AlertSeverity;
  alertId?: string;
  createdAt: string;
}

export interface UsageTrendPoint {
  timestamp: string;
  label: string;
  flowRateLpm: number;
  volumeLiters: number;
  expectedLpm?: number;
}

// ============================================================================
// Water Intelligence & AI Anomaly Types (Additive)
// ============================================================================

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type WaterAnomalyType =
  | "continuous_flow"
  | "off_hours_flow"
  | "sudden_spike"
  | "baseline_deviation"
  | "leakage_suspected";

export interface NormalizedTelemetry {
  sensor_id: string;
  device_id: string;
  flow_rate_lpm: number;
  total_volume_liters: number;
  timestamp: string;
  pulse_count?: number;
}

export interface BaselineProfile {
  hourOfDay: number;
  isWeekend: boolean;
  meanFlowLpm: number;
  stdDevLpm: number;
  minExpectedLpm: number;
  maxExpectedLpm: number;
  isLearned: boolean;
  sampleCount: number;
  locationType?: string;
}

export interface DetectedAnomaly {
  id?: string;
  type: WaterAnomalyType;
  ruleTriggered: string;
  severity: AlertSeverity;
  riskScore: number;
  riskLevel: RiskLevel;
  detectedAt: string;
  observedFlowLpm: number;
  baselineExpectedLpm: number;
  durationMinutes: number;
  estimatedLossLiters: number;
  explanation: string;
  recommendation: {
    title: string;
    description: string;
    priority: "low" | "medium" | "high" | "critical";
  };
  evidence: Record<string, any>;
}

export interface WaterAnalysisResult {
  sensorId: string;
  deviceId: string;
  timestamp: string;
  latestFlowRateLpm: number;
  latestTotalVolumeLiters: number;
  baseline: BaselineProfile;
  anomalies: DetectedAnomaly[];
  compositeRiskScore: number;
  compositeRiskLevel: RiskLevel;
  isAnomaly: boolean;
  primaryReason: string;
  primaryRecommendation: {
    title: string;
    description: string;
    priority: "low" | "medium" | "high" | "critical";
  } | null;
  avoidableVolumeTodayLiters: number;
  evaluatedAt: string;
}

