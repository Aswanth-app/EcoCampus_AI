#include "TelemetryTransport.h"

TelemetryTransport::TelemetryTransport()
  : _lastNtpSync(0), _ntpInitialized(false) {}

bool TelemetryTransport::connectWiFi(const char* ssid, const char* password, unsigned long timeoutMs) {
  Serial.println("\n[WiFi] Initializing Wi-Fi connection...");
  Serial.printf("[WiFi] Target SSID: %s\n", ssid);

  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);

  unsigned long startAttemptTime = millis();

  while (WiFi.status() != WL_CONNECTED && (millis() - startAttemptTime) < timeoutMs) {
    delay(500);
    Serial.print(".");
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n[WiFi] Connected successfully!");
    Serial.printf("[WiFi] IP Address: %s\n", WiFi.localIP().toString().c_str());
    Serial.printf("[WiFi] RSSI (Signal Strength): %d dBm\n", WiFi.RSSI());
    return true;
  } else {
    Serial.println("\n[WiFi] Connection timeout failed.");
    return false;
  }
}

bool TelemetryTransport::isConnected() {
  return (WiFi.status() == WL_CONNECTED);
}

void TelemetryTransport::ensureConnection(const char* ssid, const char* password) {
  if (!isConnected()) {
    Serial.println("[WiFi] Lost connection. Attempting auto-reconnect...");
    connectWiFi(ssid, password);
  }
}

bool TelemetryTransport::syncNTP(const char* ntp1, const char* ntp2) {
  if (!isConnected()) return false;

  Serial.println("[NTP] Synchronizing system clock via NTP...");
  // UTC timezone offset (0, 0)
  configTime(0, 0, ntp1, ntp2);

  struct tm timeinfo;
  int retry = 0;
  while (!getLocalTime(&timeinfo) && retry < 10) {
    delay(500);
    Serial.print(".");
    retry++;
  }

  if (getLocalTime(&timeinfo)) {
    char timeStr[64];
    strftime(timeStr, sizeof(timeStr), "%Y-%m-%d %H:%M:%S UTC", &timeinfo);
    Serial.printf("\n[NTP] Time synchronized: %s\n", timeStr);
    _ntpInitialized = true;
    _lastNtpSync = millis();
    return true;
  } else {
    Serial.println("\n[NTP] Failed to acquire NTP time.");
    return false;
  }
}

String TelemetryTransport::getIso8601Timestamp() {
  struct tm timeinfo;
  if (getLocalTime(&timeinfo)) {
    char buffer[32];
    strftime(buffer, sizeof(buffer), "%Y-%m-%dT%H:%M:%SZ", &timeinfo);
    return String(buffer);
  }

  // Fallback if NTP is unavailable: format from internal epoch or placeholder
  time_t now;
  time(&now);
  if (now > 100000) {
    struct tm* ptm = gmtime(&now);
    char buffer[32];
    strftime(buffer, sizeof(buffer), "%Y-%m-%dT%H:%M:%SZ", ptm);
    return String(buffer);
  }

  return "1970-01-01T00:00:00Z";
}

TelemetryResponse TelemetryTransport::sendTelemetry(
  const String& endpointUrl,
  const String& apiKey,
  const String& jsonPayload,
  int statusLedPin
) {
  TelemetryResponse resp;
  resp.httpCode = -1;
  resp.isSuccess = false;
  resp.payload = "";
  resp.errorMessage = "";

  if (!isConnected()) {
    resp.errorMessage = "Wi-Fi not connected";
    Serial.println("[Transport] ERROR: Cannot send telemetry without Wi-Fi connection.");
    return resp;
  }

  // Toggle status LED for transmit indicator
  if (statusLedPin >= 0) {
    digitalWrite(statusLedPin, HIGH);
  }

  HTTPClient http;
  bool isHttps = endpointUrl.startsWith("https://");

  if (isHttps) {
    WiFiClientSecure* secureClient = new WiFiClientSecure;
    if (secureClient) {
      secureClient->setInsecure(); // Allows HTTPS without pinning bundle for flexibility
      http.begin(*secureClient, endpointUrl);
    } else {
      resp.errorMessage = "Failed to allocate secure client";
      if (statusLedPin >= 0) digitalWrite(statusLedPin, LOW);
      return resp;
    }
  } else {
    WiFiClient client;
    http.begin(client, endpointUrl);
  }

  // Set Request Headers matching EcoCampus AI API Contract
  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-Device-API-Key", apiKey);
  http.setTimeout(10000); // 10-second timeout

  Serial.println("[Transport] Dispatching HTTP POST Telemetry...");
  Serial.printf("[Transport] Endpoint: %s\n", endpointUrl.c_str());

  int httpCode = http.POST(jsonPayload);
  resp.httpCode = httpCode;

  if (httpCode > 0) {
    resp.payload = http.getString();
    if (httpCode == 200 || httpCode == 201) {
      resp.isSuccess = true;
      Serial.printf("[Transport] Success! HTTP Status: %d\n", httpCode);
      Serial.printf("[Transport] Response Body: %s\n", resp.payload.c_str());
    } else {
      resp.isSuccess = false;
      resp.errorMessage = "HTTP Error " + String(httpCode);
      Serial.printf("[Transport] Server returned HTTP %d: %s\n", httpCode, resp.payload.c_str());
    }
  } else {
    resp.isSuccess = false;
    resp.errorMessage = http.errorToString(httpCode);
    Serial.printf("[Transport] POST failed with error: %s (code %d)\n", resp.errorMessage.c_str(), httpCode);
  }

  http.end();

  if (statusLedPin >= 0) {
    digitalWrite(statusLedPin, LOW);
  }

  return resp;
}
