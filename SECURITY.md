# EcoCampus AI — Cybersecurity & Privacy Policy

This document outlines the cybersecurity architecture, verified security controls, threat models, and operational practices implemented in the EcoCampus AI resource intelligence platform.

---

## 1. Security Architecture Overview

EcoCampus AI implements defense-in-depth across the full IoT and cloud stack, spanning edge microcontroller hardware, network transport, ingestion endpoints, business intelligence, and database storage.

```
[ ESP32 IoT Node ]
       │
       ▼ (TLS 1.3 / HTTPS Encrypted Transport)
[ Ingestion Gateway (POST /api/v1/telemetry/ingest) ]
       │
       ├── Rate Limiting (30 req/min sliding window)
       ├── API Key Hashing (SHA-256 with Timing-Safe Verification)
       ├── Input Validation & Physical Boundary Checks (0-120 L/min, skew <5m)
       ├── Device-Sensor Registry Mapping Verification
       └── Session Security Event Logging
       │
       ▼ (Server-Only SUPABASE_SERVICE_ROLE_KEY)
[ Supabase PostgreSQL ] (Row Level Security Active)
```

---

## 2. Implemented Security Controls

### 2.1 API Authentication
- **Mechanism**: Device requests must supply `X-Device-API-Key` in request headers.
- **Implementation**: Incoming plaintext keys are hashed on-the-fly using `SHA-256` (`lib/security.ts`).
- **Timing-Safe Comparison**: Hashes are matched against registered device hashes using `crypto.timingSafeEqual` to eliminate side-channel timing attack vectors.
- **Status**: **PROTECTED** (Fully Implemented & Verified).

### 2.2 Device Identity & Authorization Verification
- **Mechanism**: Cryptographic hardware identity check.
- **Implementation**: Ingestion checks that `device_id` exists in `public.devices`, is in `active`/`online` status, and that the specified `sensor_id` is cryptographically and relationally bound to that exact device.
- **Status**: **PROTECTED** (Fully Implemented & Verified).

### 2.3 HTTPS Communication (Transport Layer Security)
- **Mechanism**: Encrypted in-transit transport protocol (TLS 1.3 / TLS 1.2 minimum).
- **Implementation**: Production deployments enforce automatic HTTPS redirection and HTTP Strict Transport Security (HSTS) headers via cloud edge gateways (Vercel).
- **Status**: **PROTECTED** (Fully Implemented & Verified).

### 2.4 Telemetry Input Validation & Boundary Enforcement
- **Mechanism**: Strict schema enforcement and physical reality sanity checks.
- **Implementation**:
  - Validates numeric type, non-negative flow rates, total volume liters, and pulse counts.
  - Enforces physical hardware ceiling on water flow rate ($\le 120\text{ L/min}$) to reject forged burst packets.
  - Validates ISO-8601 timestamps and rejects packets with future timestamps exceeding allowable clock skew ($> 5\text{ minutes}$).
- **Status**: **PROTECTED** (Fully Implemented & Verified).

### 2.5 Rate Limiting & DoS Protection
- **Mechanism**: In-memory sliding-window rate limiter per client IP / Device identifier.
- **Implementation**: Rejects excessive request bursts ($> 30\text{ requests/minute}$) with HTTP `429 Too Many Requests` while seamlessly supporting the standard ESP32 5-second interval ($12\text{ requests/minute}$).
- **Status**: **PROTECTED** (Fully Implemented & Verified).

### 2.6 Environment Secret Protection
- **Mechanism**: Strict segregation of public client keys and server-only administrative secrets.
- **Implementation**:
  - `SUPABASE_SERVICE_ROLE_KEY` is exclusively read by backend server routes (`lib/supabase.ts`) and is never prefixed with `NEXT_PUBLIC_`.
  - Sensitive files (`.env`, `.env.local`, `*.pem`, `*.key`) are included in `.gitignore`.
  - Zero sensitive credentials printed in telemetry audit logs or client responses.
- **Status**: **PROTECTED** (Fully Implemented & Verified).

### 2.7 Database Access Control & Row Level Security (RLS)
- **Mechanism**: Multi-tenant Row Level Security policies in Supabase PostgreSQL.
- **Implementation**: Defined in `supabase/migrations/20260821000000_phase2_ecocampus_schema.sql` utilizing `get_current_user_org_id()` isolation policies for organizations, campuses, buildings, locations, devices, sensors, and telemetry.
- **Status**: **PROTECTED** (Fully Implemented & Verified).

### 2.8 Audit Logging & Security Event Subsystem
- **Mechanism**: Real-time session-based security event recorder (`lib/security-events.ts`).
- **Implementation**: Captures authentication failures, unauthorized device attempts, malformed payload rejections, rate bursts, and baseline audits.
- **Storage Type**: Session-based in-memory circular buffer (capped at 100 events) accessible via `GET /api/v1/security/events` and the `/security` dashboard.
- **Status**: **PROTECTED** (Fully Implemented & Verified).

---

## 3. Configuration Required & Planned Features

| Feature | Category | Status | Notes |
| :--- | :--- | :--- | :--- |
| **mTLS / X.509 Device Certificates** | Hardware Auth | *Planned* | Planned for Phase 3 enterprise hardware rollout. |
| **Permanent SIEM / Syslog Integration** | Audit Logging | *Configuration Required* | Optional cloud forwarder (e.g. Datadog / AWS CloudWatch) for multi-year retention. |
| **Automated Key Rotation Cron** | Key Lifecycle | *Planned* | Planned UI action for automated 90-day device credential rotation. |

---

## 4. Responsible Disclosure

If you discover a potential vulnerability or security concern in EcoCampus AI, please disclose it responsibly:
- **Email**: security@ecocampus.internal (or submit an issue marked `[SECURITY]`)
- Please provide detailed steps to reproduce the issue.
- Do not publicly disclose any potential vulnerability until our team has verified and addressed it.
