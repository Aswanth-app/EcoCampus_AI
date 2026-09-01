/**
 * ============================================================================
 * ECOCAMPUS AI — ESP32 WATER FLOW MONITORING NODE (PHASE 4)
 * ============================================================================
 * 
 * Hardware Target: ESP32 DevKit V1
 * Flow Sensor:     YF-S201 Hall Effect Water Flow Sensor
 * Power:           5V USB / Phone Hotspot Wi-Fi
 * Backend API:     POST /api/v1/telemetry/ingest
 * 
 * Safety:
 * - Low-voltage 5V/3.3V DC operation only.
 * - No AC mains / No pumps connected.
 * ============================================================================
 */

#include <Arduino.h>
#include "config.h"
#include "TelemetryTransport.h"

// ----------------------------------------------------------------------------
// Global State & ISR Variables
// ----------------------------------------------------------------------------
// Volatile pulse counter incremented on each falling/rising edge from the Hall sensor
volatile unsigned long totalPulseCount = 0;
volatile unsigned long intervalPulseCount = 0;

// Timing counters
unsigned long lastSampleTime = 0;
unsigned long lastTelemetryTime = 0;
unsigned long lastWiFiCheckTime = 0;

// Measurement metrics
float currentFlowRateLpm = 0.0f;
float totalVolumeLiters = 0.0f;

// Transport Layer
TelemetryTransport transport;

// ----------------------------------------------------------------------------
// Interrupt Service Routine (ISR)
// Kept in IRAM for fast execution and minimal interrupt latency on ESP32
// ----------------------------------------------------------------------------
void IRAM_ATTR onFlowSensorPulse() {
  totalPulseCount++;
  intervalPulseCount++;
}

// ----------------------------------------------------------------------------
// Setup
// ----------------------------------------------------------------------------
void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println("\n==================================================");
  Serial.println("   ECOCAMPUS AI — ESP32 WATER FLOW NODE v1.0      ");
  Serial.println("==================================================");
  Serial.printf("Device UID:  %s\n", DEVICE_ID);
  Serial.printf("Sensor ID:   %s\n", SENSOR_ID);
  Serial.printf("Flow Pin:    GPIO %d\n", FLOW_SENSOR_PIN);
  Serial.printf("Status LED:  GPIO %d\n", STATUS_LED_PIN);
  Serial.println("==================================================\n");

  // Configure Status LED
  pinMode(STATUS_LED_PIN, OUTPUT);
  digitalWrite(STATUS_LED_PIN, LOW);

  // Configure Flow Sensor Pin with Internal Pull-Up
  pinMode(FLOW_SENSOR_PIN, INPUT_PULLUP);
  attachInterrupt(digitalPinToInterrupt(FLOW_SENSOR_PIN), onFlowSensorPulse, FALLING);

  // Initialize Network Connection
  bool connected = transport.connectWiFi(WIFI_SSID, WIFI_PASSWORD, WIFI_CONNECT_TIMEOUT_MS);
  if (connected) {
    // Synchronize Real-Time Clock via NTP
    transport.syncNTP(NTP_SERVER_1, NTP_SERVER_2);
  } else {
    Serial.println("[Warning] Starting loop in offline buffering mode. Will auto-retry Wi-Fi.");
  }

  lastSampleTime = millis();
  lastTelemetryTime = millis();
  lastWiFiCheckTime = millis();
}

// ----------------------------------------------------------------------------
// Helper: Construct JSON Payload Matching EcoCampus AI Schema Contract
// ----------------------------------------------------------------------------
String buildTelemetryJson(float flowRate, float totalVolume, unsigned long pulses, const String& timestamp) {
  // Format matching exact backend schema:
  // {
  //   "device_id": "DEV_ESP32_001",
  //   "sensor_id": "00000000-0000-4000-a000-000000000006",
  //   "flow_rate_lpm": 12.50,
  //   "total_volume_liters": 450.20,
  //   "pulse_count": 560,
  //   "timestamp": "2026-08-30T16:30:00Z"
  // }
  char jsonBuffer[384];
  snprintf(
    jsonBuffer,
    sizeof(jsonBuffer),
    "{"
    "\"device_id\":\"%s\","
    "\"sensor_id\":\"%s\","
    "\"flow_rate_lpm\":%.2f,"
    "\"total_volume_liters\":%.2f,"
    "\"pulse_count\":%lu,"
    "\"timestamp\":\"%s\""
    "}",
    DEVICE_ID,
    SENSOR_ID,
    flowRate,
    totalVolume,
    pulses,
    timestamp.c_str()
  );
  return String(jsonBuffer);
}

// ----------------------------------------------------------------------------
// Main Loop
// ----------------------------------------------------------------------------
void loop() {
  unsigned long currentMillis = millis();

  // 1. Periodic Flow Rate & Volume Calculation (Every 1000ms)
  if (currentMillis - lastSampleTime >= FLOW_SAMPLE_INTERVAL_MS) {
    unsigned long sampleElapsed = currentMillis - lastSampleTime;
    lastSampleTime = currentMillis;

    // Atomically read and reset the interval pulses
    noInterrupts();
    unsigned long pulsesThisSample = intervalPulseCount;
    intervalPulseCount = 0;
    unsigned long snapshotTotalPulses = totalPulseCount;
    interrupts();

    // Pulse Frequency (Hz) = pulses / seconds
    float sampleSec = (float)sampleElapsed / 1000.0f;
    float pulseFrequencyHz = (sampleSec > 0.0f) ? ((float)pulsesThisSample / sampleSec) : 0.0f;

    // Flow Rate (L/min) = Frequency (Hz) / Calibration Factor (7.5 for YF-S201)
    currentFlowRateLpm = pulseFrequencyHz / SENSOR_CALIBRATION_FACTOR;

    // Total Volume (Liters) = Cumulative Pulses / (Calibration Factor * 60)
    // 7.5 pulses/sec for 1 L/min => 7.5 * 60 = 450 pulses per Liter
    totalVolumeLiters = (float)snapshotTotalPulses / (SENSOR_CALIBRATION_FACTOR * 60.0f);

    // Diagnostics to Serial Monitor
    Serial.printf("[Sensor] Pulses/sec: %.1f Hz | Flow Rate: %.2f L/min | Total Volume: %.3f L | Total Pulses: %lu\n",
                  pulseFrequencyHz, currentFlowRateLpm, totalVolumeLiters, snapshotTotalPulses);
  }

  // 2. Periodic Network Connection Health Check (Every 10s)
  if (currentMillis - lastWiFiCheckTime >= 10000) {
    lastWiFiCheckTime = currentMillis;
    if (!transport.isConnected()) {
      Serial.println("[WiFi] Connection lost. Attempting reconnection...");
      transport.connectWiFi(WIFI_SSID, WIFI_PASSWORD, 8000);
    }
  }

  // 3. Periodic Telemetry Transmission (Every TELEMETRY_INTERVAL_MS)
  if (currentMillis - lastTelemetryTime >= TELEMETRY_INTERVAL_MS) {
    lastTelemetryTime = currentMillis;

    noInterrupts();
    unsigned long currentPulses = totalPulseCount;
    interrupts();

    String isoTimestamp = transport.getIso8601Timestamp();
    String jsonPayload = buildTelemetryJson(currentFlowRateLpm, totalVolumeLiters, currentPulses, isoTimestamp);

    Serial.println("\n--------------------------------------------------");
    Serial.println("[Telemetry] Preparing Ingest Payload:");
    Serial.println(jsonPayload);
    Serial.println("--------------------------------------------------");

    // Transmit via HTTP/HTTPS Transport Layer
    TelemetryResponse response = transport.sendTelemetry(
      API_SERVER_URL,
      DEVICE_API_KEY,
      jsonPayload,
      STATUS_LED_PIN
    );

    if (response.isSuccess) {
      Serial.printf("[Telemetry] Telemetry accepted by EcoCampus AI (HTTP %d)\n", response.httpCode);
    } else {
      Serial.printf("[Telemetry] Ingest Failed: %s (HTTP %d)\n", response.errorMessage.c_str(), response.httpCode);
    }
    Serial.println("--------------------------------------------------\n");
  }

  // Yield to background tasks (Wi-Fi stack, watchdog)
  delay(10);
}
