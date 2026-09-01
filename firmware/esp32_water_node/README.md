# EcoCampus AI — ESP32 Water Node Firmware (Phase 4)

Firmware for the **ESP32 DevKit V1** and **YF-S201 Water Flow Sensor** reporting real-time telemetry to the EcoCampus AI backend API.

---

## 1. Hardware Pinout & Wiring

| YF-S201 Wire | Function | ESP32 DevKit V1 Pin | Notes |
|---|---|---|---|
| **Red** | Power Input | **VIN** (5V from USB) or **3V3** | YF-S201 operates from 4.5V–18V (or 3.3V on short leads) |
| **Black** | Ground | **GND** | Common Ground |
| **Yellow** | Pulse Output (Hall Signal) | **GPIO 4** | Configured with `INPUT_PULLUP` and Hardware Interrupt |

### Optional Status LED
- **GPIO 2:** Built-in blue LED on ESP32 DevKit V1 used as network activity and telemetry transmit indicator.

---

## 2. Safety Guidelines

> [!IMPORTANT]
> **Safety Notice:**
> - This project operates strictly on **low-voltage DC (5V USB / 3.3V)**.
> - **DO NOT** connect or switch 230V AC mains electricity.
> - **DO NOT** connect or drive submersible AC pumps directly.
> - Ensure water plumbing connections are sealed tightly to prevent liquid from splashing onto the ESP32 development board.

---

## 3. Telemetry Payload Contract

The firmware sends an HTTP/HTTPS POST request to:
`POST /api/v1/telemetry/ingest`

### Headers
```http
Content-Type: application/json
X-Device-API-Key: <your_device_api_key>
```

### JSON Body
```json
{
  "device_id": "DEV_ESP32_001",
  "sensor_id": "00000000-0000-4000-a000-000000000006",
  "flow_rate_lpm": 12.50,
  "total_volume_liters": 450.20,
  "pulse_count": 560,
  "timestamp": "2026-08-30T16:30:00Z"
}
```

---

## 4. Software & Library Requirements

### Arduino IDE Configuration:
- **Board:** `ESP32 Dev Module` (via `esp32` by Espressif Systems board package in Board Manager)
- **Flash Frequency:** `80MHz`
- **Upload Speed:** `921600` or `115200`
- **CPU Frequency:** `240MHz`

### Built-in Libraries Used (No external third-party library installations needed):
- `WiFi.h` (ESP32 Core)
- `HTTPClient.h` (ESP32 Core)
- `WiFiClientSecure.h` (ESP32 Core)
- `time.h` (ESP32 Core SNTP)

---

## 5. Configuration (`config.h`)

Before flashing the ESP32:
1. Open [`config.h`](file:///c:/Users/DELL/Downloads/ECO%20CAMPUS%20AI/firmware/esp32_water_node/config.h).
2. Set your phone hotspot credentials:
   ```cpp
   #define WIFI_SSID       "YOUR_PHONE_HOTSPOT_SSID"
   #define WIFI_PASSWORD   "YOUR_HOTSPOT_PASSWORD"
   ```
3. Set your target API Server URL:
   - For local laptop testing (connected to same hotspot): `http://192.168.x.x:3000/api/v1/telemetry/ingest`
   - For deployed cloud API: `https://your-domain.vercel.app/api/v1/telemetry/ingest`
4. Set the device API key:
   ```cpp
   #define DEVICE_API_KEY  "dev_secret_key_001"
   ```

---

## 6. Serial Monitor Diagnostics

Open the Arduino IDE Serial Monitor at **115200 baud**. You will see:
```text
==================================================
   ECOCAMPUS AI — ESP32 WATER FLOW NODE v1.0      
==================================================
Device UID:  DEV_ESP32_001
Sensor ID:   00000000-0000-4000-a000-000000000006
Flow Pin:    GPIO 4
Status LED:  GPIO 2
==================================================

[WiFi] Initializing Wi-Fi connection...
[WiFi] Target SSID: MyPhoneHotspot
.......
[WiFi] Connected successfully!
[WiFi] IP Address: 192.168.43.150
[WiFi] RSSI (Signal Strength): -52 dBm
[NTP] Synchronizing system clock via NTP...
[NTP] Time synchronized: 2026-08-30 16:30:00 UTC

[Sensor] Pulses/sec: 93.8 Hz | Flow Rate: 12.50 L/min | Total Volume: 0.208 L | Total Pulses: 94

--------------------------------------------------
[Telemetry] Preparing Ingest Payload:
{"device_id":"DEV_ESP32_001","sensor_id":"00000000-0000-4000-a000-000000000006","flow_rate_lpm":12.50,"total_volume_liters":0.21,"pulse_count":94,"timestamp":"2026-08-30T16:30:05Z"}
--------------------------------------------------
[Transport] Dispatching HTTP POST Telemetry...
[Transport] Success! HTTP Status: 201
[Transport] Response Body: {"success":true,"message":"Telemetry accepted"}
--------------------------------------------------
```
