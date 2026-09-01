#ifndef TELEMETRY_TRANSPORT_H
#define TELEMETRY_TRANSPORT_H

#include <Arduino.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include <time.h>

struct TelemetryResponse {
  int httpCode;
  String payload;
  bool isSuccess;
  String errorMessage;
};

class TelemetryTransport {
public:
  TelemetryTransport();

  // Network lifecycle management
  bool connectWiFi(const char* ssid, const char* password, unsigned long timeoutMs = 15000);
  bool isConnected();
  void ensureConnection(const char* ssid, const char* password);
  
  // NTP Clock synchronization
  bool syncNTP(const char* ntp1 = "pool.ntp.org", const char* ntp2 = "time.nist.gov");
  String getIso8601Timestamp();

  // Telemetry Dispatch (Supports HTTP and HTTPS)
  TelemetryResponse sendTelemetry(
    const String& endpointUrl,
    const String& apiKey,
    const String& jsonPayload,
    int statusLedPin = -1
  );

private:
  unsigned long _lastNtpSync;
  bool _ntpInitialized;
};

#endif // TELEMETRY_TRANSPORT_H
