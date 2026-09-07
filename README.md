# EcoCampus AI — Sustainable Campus Resource Intelligence Platform

EcoCampus AI is a production-grade campus sustainability and resource monitoring system powered by real-time IoT hardware telemetry, automated anomaly intelligence, and enterprise-grade cybersecurity.

---

## Key Features

- **Live Water Telemetry (MVP)**: Real-time pulse rate & flow ingestion from physical ESP32 microcontrollers and YF-S201 Hall-effect flow sensors.
- **Resource Intelligence Engine**: Automated anomaly detection, continuous leak detection (>15 min), off-hours flow alerts, and sudden surge identification.
- **Facility Operations Dashboard**: Real-time KPI summaries, building matrices, historical archives, and live telemetry cards.
- **Cybersecurity & Threat Posture**: Enterprise defense layer with real-time security control auditing and session-based event logging.

---

## Cybersecurity Architecture

EcoCampus AI incorporates an additive, defense-in-depth cybersecurity layer designed to protect IoT edge telemetry, cloud APIs, and database resources:

- **Secure Telemetry Ingestion**: All telemetry received at `POST /api/v1/telemetry/ingest` undergoes cryptographic verification, boundary validation, and duplicate protection.
- **Device Authentication**: Authenticated via `X-Device-API-Key` headers; keys are hashed using `SHA-256` and compared using `crypto.timingSafeEqual` to eliminate timing attacks.
- **Hardware Identity Verification**: Hardware UID, registered sensor mappings, and active status checks prevent rogue devices or mismatched sensors from injecting telemetry.
- **Telemetry Input Validation**: Strict JSON payload schema validation, non-negative range filters, physical sensor rate caps (0–120 L/min), and timestamp skew checks (max 5 minutes).
- **Rate Limiting & DoS Protection**: Sliding-window rate limiter (30 requests/minute per client IP) mitigating telemetry flooding and burst replay attacks.
- **HTTPS & TLS 1.3 Transport**: Encrypted in-transit communication with enforced HTTPS redirection and HSTS headers.
- **Environment Secret Protection**: Clear segregation of public client keys and server-only administrative secrets (`SUPABASE_SERVICE_ROLE_KEY`) with `.gitignore` secret exclusion.
- **Database Access Control**: Supabase PostgreSQL Row Level Security (RLS) policies enforcing multi-tenant organizational isolation.
- **Session-Based Audit Logging**: Real-time security event tracking accessible at `/security` and `GET /api/v1/security/events` without logging sensitive credentials.

For full technical specifications and threat models, see [SECURITY.md](SECURITY.md).

---

## Getting Started

### Prerequisites

- Node.js 18+ or 20+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/ecocampus-ai.git
cd ecocampus-ai

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env.local
```

### Running Locally

```bash
# Run the development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## Verified Security Controls

1. **API Authentication**: *Protected* (SHA-256 Hashing + Timing-Safe Verification)
2. **Device Identity Verification**: *Protected* (Hardware UID + Sensor Association)
3. **HTTPS Communication**: *Protected* (TLS 1.3 In-Transit Transport)
4. **Telemetry Input Validation**: *Protected* (Strict Schema, 0-120 L/min Cap, Skew Check)
5. **Rate Limiting**: *Protected* (30 req/min Sliding Window)
6. **Database Access Control**: *Protected* (Supabase Row Level Security & Service Key Segregation)
7. **Environment Secret Protection**: *Protected* (Zero Client Secret Leakage, .env Segregation)
8. **Audit Logging**: *Protected* (Session-Based Security Event Stream)
