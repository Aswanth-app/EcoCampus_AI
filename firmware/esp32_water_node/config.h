#ifndef CONFIG_H
#define CONFIG_H

#include <Arduino.h>

// Include local-only secrets if present (secrets.h is gitignored)
#if __has_include("secrets.h")
#include "secrets.h"
#endif

// ============================================================================
// ECOCAMPUS AI — ESP32 WATER NODE HARDWARE & NETWORK CONFIGURATION
// ============================================================================

// ----------------------------------------------------------------------------
// 1. Wi-Fi Hotspot Credentials (Defaults/Placeholders if secrets.h is absent)
// ----------------------------------------------------------------------------
#ifndef WIFI_SSID
#define WIFI_SSID           "YOUR_WIFI_SSID"
#endif

#ifndef WIFI_PASSWORD
#define WIFI_PASSWORD       "YOUR_WIFI_PASSWORD"
#endif

#ifndef WIFI_CONNECT_TIMEOUT_MS
#define WIFI_CONNECT_TIMEOUT_MS  15000 // 15 seconds connection timeout
#endif

#ifndef WIFI_RETRY_DELAY_MS
#define WIFI_RETRY_DELAY_MS      3000  // 3 seconds between retries
#endif

// ----------------------------------------------------------------------------
// 2. EcoCampus AI Backend Telemetry API Configuration
// ----------------------------------------------------------------------------
// Target endpoint matching backend route: POST /api/v1/telemetry/ingest
// When testing against a local Next.js dev server on your laptop (connected to the same phone hotspot):
// Use your laptop's Wi-Fi hotspot IP (e.g. "http://192.168.43.100:3000/api/v1/telemetry/ingest")
// When deployed to production / cloud:
// Use your secure HTTPS domain (e.g. "https://your-domain.vercel.app/api/v1/telemetry/ingest")
#ifndef API_SERVER_URL
#define API_SERVER_URL      "https://eco-campus-ai-nine.vercel.app/api/v1/telemetry/ingest"
#endif

// Device Authentication Key
// Must match the pre-shared key whose SHA-256 hash is registered in the devices database table
#ifndef DEVICE_API_KEY
#define DEVICE_API_KEY      "dev_secret_key_001"
#endif

// ----------------------------------------------------------------------------
// 3. Hardware Identity & Sensor Registry Mappings
// (Matches public.devices and public.sensors in Supabase schema)
// ----------------------------------------------------------------------------
#ifndef DEVICE_ID
#define DEVICE_ID           "DEV_ESP32_001"
#endif

#ifndef SENSOR_ID
#define SENSOR_ID           "00000000-0000-4000-a000-000000000006"
#endif

// ----------------------------------------------------------------------------
// 4. Hardware Pin Allocations (ESP32 DevKit V1)
// ----------------------------------------------------------------------------
#define FLOW_SENSOR_PIN     4   // GPIO 4 (Interrupt-capable, non-strapping pin)
#define STATUS_LED_PIN      2   // GPIO 2 (Onboard blue LED for network & transmit status)

// ----------------------------------------------------------------------------
// 5. Sensor Calibration & Timing Parameters (YF-S201)
// ----------------------------------------------------------------------------
// YF-S201 pulse characteristic: F (Hz) = 7.5 * Q (L/min)
// 7.5 pulses per second for 1 L/min flow rate => 450 pulses = 1 Liter of water
#define SENSOR_CALIBRATION_FACTOR   7.5f

// Telemetry Dispatch Intervals
#define TELEMETRY_INTERVAL_MS       5000  // Dispatch telemetry every 5 seconds (configurable)
#define FLOW_SAMPLE_INTERVAL_MS     1000  // Calculate instantaneous flow every 1 second

// ----------------------------------------------------------------------------
// 6. NTP Time Server Configuration
// ----------------------------------------------------------------------------
#define NTP_SERVER_1        "pool.ntp.org"
#define NTP_SERVER_2        "time.nist.gov"
#define NTP_TIMEOUT_MS      5000

#endif // CONFIG_H
