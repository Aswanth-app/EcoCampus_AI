# EcoCampus AI — Predict. Prevent. Optimize.

An AI-assisted campus resource intelligence platform for monitoring water usage, detecting abnormal consumption, and recommending preventive actions.

---

## 1. Problem Statement

Water distribution on university and institutional campuses is dynamic, decentralized, and prone to silent waste. Traditional campus water management systems rely on periodic manual meter readings or simple fixed-rate thresholds.

Fixed thresholds are fundamentally flawed in campus environments:
- **Peak-Hour False Alarms**: A static threshold (e.g., flagging any flow $> 5\text{ L/min}$) triggers false alarms during legitimate peak-demand periods—such as morning hostel washroom rushes or dining hall preparation.
- **Undetected Stealth Waste**: Fixed thresholds completely miss continuous low-flow leaks (e.g., a tap left running at $2.5\text{ L/min}$ or a leaking flush tank at $1.0\text{ L/min}$) that run silently for hours overnight, causing massive cumulative water loss and energy overhead without ever tripping a maximum rate threshold.

Campus water intelligence requires understanding **temporal context**, **flow duration**, **building type**, and **occupancy patterns** to accurately differentiate legitimate consumption from preventable waste.

---

## 2. Solution Overview

EcoCampus AI addresses dynamic consumption by combining multi-dimensional contextual parameters into an intelligent detection and explainability pipeline:

- **Flow Rate ($\text{L/min}$)**: Instantaneous measurement from calibrated hardware sensors.
- **Flow Duration ($\text{Minutes / Seconds}$)**: Continuous duration tracking to differentiate brief usage bursts from runaway leaks.
- **Time of Day ($\text{Diurnal Schedule}$)**: Distinguishing peak operating hours from off-peak / quiescent night windows ($00:00 - 05:00$).
- **Activity & Occupancy Context**: Correlating water draw with facility occupancy signals or expected zone activity.
- **Historical Baseline**: Continuous Gaussian diurnal profiling ($\mu \pm 2\sigma$) learned from historical campus telemetry.
- **Location Context**: Restroom, hostel, academic block, or dining facility profiles with tailored consumption models.

---

## 3. System Architecture & Telemetry Pipeline

```
[ Water Flow Sensor (YF-S201 Inline) ]
                 │
                 ▼ (Pulse Interrupts on GPIO 4)
[ ESP32 Water Node (ESP32 DevKit V1) ]
                 │
                 ▼ (Encrypted HTTPS / TLS 1.3 Transport)
[ Ingestion API Gateway (POST /api/v1/telemetry/ingest) ]
  ├── Device API Key Authentication (SHA-256 + Timing-Safe)
  ├── Sliding-Window Rate Limiting (30 req/min)
  └── Strict Payload Validation & Clock Skew Checks
                 │
                 ▼ (Server-Side Storage & Realtime Stream)
[ Supabase Telemetry (PostgreSQL + RLS) ]
                 │
                 ▼ (Dynamic Multi-Rule Engine & Diurnal Profiler)
[ Context-Aware Analysis ]
                 │
                 ▼ (0–100 Normalized Score)
[ Risk Score & Classification (NORMAL | LOW | MEDIUM | CRITICAL) ]
                 │
                 ▼ (Plain-English Root Cause & Avoidable Liters)
[ Recommended Action ]
                 │
                 ▼ (Live Real-Time Monitoring & Operations)
[ EcoCampus AI Dashboard ]
```

---

## 4. Key Features

### Implemented Features
- **Live Water Usage Monitoring**: High-frequency real-time telemetry ingestion tracking instantaneous flow rate ($\text{L/min}$), cumulative volume ($\text{Liters}$), and pulse frequency ($\text{Hz}$).
- **ESP32 Edge Firmware**: FreeRTOS hardware interrupt pulse counting, SNTP time synchronization, automatic non-blocking Wi-Fi reconnection, and secure HTTPS transmission.
- **Context-Aware Waste Detection**: Multi-rule evaluation engine detecting continuous unreturned flow, off-hours nocturnal anomalies, sudden surges, baseline deviations, and micro-leaks.
- **Dynamic Risk Scoring & Actionable Recommendations**: Deterministic 0–100 composite risk scoring with severity tiers (`NORMAL`, `LOW`, `MEDIUM`, `CRITICAL`), avoidable water loss estimation, and concrete maintenance recommendations.
- **Security & Reliability Controls**: Cryptographic SHA-256 device authentication with timing-safe comparisons (`crypto.timingSafeEqual`), hardware UID binding, in-memory sliding-window rate limiting, and session security audit logging (`/security`).
- **Facility Operations Dashboard**: Multi-view operational dashboard covering campus overview, dedicated water telemetry view, device management, security health center, and analytical reporting.
- **Resource Intelligence Module**: Dedicated interactive intelligence portal (`/round2`) showcasing side-by-side scenario evaluations and interactive architectural Q&A.

### Prototype Features
- **YF-S201 Inline Flow Sensing**: Benchtop prototype sensor integration for direct volumetric pulse calibration.
- **Diurnal Gaussian Baseline Profiler**: Hourly mean and standard deviation envelope ($\mu \pm 2\sigma$) with fallback heuristic models during cold-start phases.

### Simulated Demonstration Scenarios
- **Explainability Demonstrations**: In-memory simulation runner for evaluating multi-factor decision logic without modifying production database telemetry.

### Future Improvements
- **External Clamp-on Ultrasonic Flow Pilot**: Non-invasive transit-time sensor rollout across primary risers.
- **Machine Learning Extensions**: Proposed Isolation Forest unsupervised anomaly model and ESP32-S3 edge TinyML quantization.

---

## 5. Resource Intelligence Scenarios

The Resource Intelligence Module (`/round2`) demonstrates why static flow thresholds fail and how contextual analysis produces accurate, explainable risk assessments.

| Parameter | Scenario A: Normal Handwashing | Scenario B: Tap Left Open |
|---|---|---|
| **Flow Rate** | $2.5\text{ L/min}$ | $2.5\text{ L/min}$ (Identical rate) |
| **Duration** | $20\text{ seconds}$ | $10\text{ minutes}\;(600\text{ s})$ |
| **Time of Day** | $8:00\text{ AM}$ (Peak Morning Activity) | $2:00\text{ AM}$ (Off-Peak / Quiescent Night) |
| **Activity Status** | Activity Detected (Active Restroom) | No Activity Detected (Unattended) |
| **Historical Baseline** | $3.2\text{ L/min}$ expected | $0.1\text{ L/min}$ expected |
| **Decision Result** | **Normal Usage** | **High Water Waste Risk** |
| **Risk Score** | `12 / 100` (`LOW`) | `94 / 100` (`CRITICAL`) |
| **Recommendation** | Routine monitoring; conforms to transient handwashing. | Urgent inspection dispatched to floor warden; estimated $25.0\text{ L}$ loss. |

> [!NOTE]
> **Simulation Integrity**: These demonstration scenarios are isolated and evaluated purely in-memory. They illustrate the AI decision pipeline without injecting fake or simulated records into the live Supabase telemetry database.

---

## 6. Sensor Deployment & Hardware Architecture

### Current Prototype: Inline Turbine Sensor
- **Hardware**: **YF-S201** Hall-effect turbine flow sensor.
- **Physical Installation**: Plumbed inline with $1/2''$ piping.
- **Electrical Interface**: Operates at $5\text{V}$ / $3.3\text{V}$ DC logic connected to ESP32 DevKit V1 **GPIO 4** with internal pull-up and hardware interrupt.
- **Calibration Factor**: $\sim 7.5\text{ pulses/second per L/min}$.
- *Note: The YF-S201 is strictly an inline sensor and is never classified as clamp-on.*

### Future Pilot: Non-Invasive Clamp-On Ultrasonic Sensors
- **Target Technology**: External clamp-on transit-time ultrasonic flow meters.
- **Advantage**: Zero pipe cutting, zero contamination risk, zero water supply downtime during installation, and compatibility with large-diameter main supply lines ($1''$ to $4''$).

---

## 7. Deployment Strategy: Hierarchical Inlet-First

EcoCampus AI advocates a scalable, cost-efficient deployment strategy rather than placing expensive sensors on every individual tap:

1. **Phase 1 — Main Building Inlets**: Install primary flow sensors on the main water inlet of each campus block/building. This captures $100\%$ of total consumption, validates bulk billing, and reliably identifies overnight quiescent baseflow leaks across the entire facility.
2. **Phase 2 — High-Risk Sub-Zones**: Deploy secondary sensors only in high-volume, high-risk zones (e.g., commercial dining kitchens, central boilers, swimming pools, laboratory wash-down lines).
3. **Phase 3 — Targeted Risers**: Sub-meter specific floor risers only when macro anomaly alerts persist and require targeted isolation.

---

## 8. Technology Stack

### Frontend & Dashboard
- **Framework**: Next.js 16 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS v4, PostCSS, Lucide React icons, `clsx`, `tailwind-merge`

### Backend & Cloud Ingestion
- **API Runtime**: Next.js Serverless Route Handlers (`app/api/v1/*`)
- **Database & Realtime**: Supabase (Managed PostgreSQL, Row Level Security, Realtime subscriptions)

### IoT Firmware & Hardware
- **Microcontroller**: ESP32 DevKit V1 (Espressif Systems)
- **Firmware Stack**: C++ / Arduino framework, FreeRTOS hardware interrupts, `WiFiClientSecure`, `HTTPClient`, SNTP
- **Current Sensor**: YF-S201 Hall-effect inline water flow sensor

### Intelligence & Anomaly Engine
- **Heuristic Engine**: Deterministic multi-rule evaluator (continuous flow, off-hours, sudden surge, micro-leak)
- **Baseline Engine**: Diurnal Gaussian envelope model ($\mu \pm 2\sigma$) with fallback profiles
- **Scoring & Explainability**: Normalized composite risk scorer ($0–100$) and plain-English recommendation synthesizer
- *Machine Learning Note*: Isolation Forest algorithms and TinyML edge quantization are documented design models for production pilot scaling.

---

## 9. Cybersecurity & Reliability Controls

EcoCampus AI implements a defense-in-depth security model across the IoT and cloud layers:

- **API Authentication**: Device ingestion requests require an `X-Device-API-Key` header. Keys are hashed on the fly using `SHA-256` and validated with `crypto.timingSafeEqual` to eliminate timing side-channel attacks.
- **Device Identity Verification**: Ingestion verifies that `device_id` exists in the registry, is in an `active` state, and is cryptographically bound to the reporting `sensor_id`.
- **Payload Schema & Boundary Enforcement**: Rejects non-object bodies, negative values, flow rates exceeding physical sensor maximums ($>120\text{ L/min}$), and malformed timestamps.
- **Clock Skew Mitigation**: Rejects telemetry packets with timestamps $>5\text{ minutes}$ in the future to prevent replay or clock tampering.
- **Rate Limiting & DoS Defense**: In-memory sliding-window rate limiter ($30\text{ req/min}$ per client/IP) preventing telemetry flooding while supporting the standard ESP32 $5\text{s}$ heartbeat.
- **Audit Logging**: Session-based security event logger tracking all rejected ingestion attempts, rate limit breaches, and authentication failures without leaking credentials (`/security`).
- **Database Access Control**: PostgreSQL Row Level Security (RLS) policies enforced via Supabase service role segregation.

---

## 10. Project Structure

```
EcoCampus_AI/
├── app/                               # Next.js App Router
│   ├── api/v1/                        # REST Ingestion & Security Endpoints
│   │   ├── ai/                        # AI Evaluation API
│   │   ├── security/events/           # Audit Event Streaming
│   │   └── telemetry/ingest/          # ESP32 Secure Telemetry Ingestion Gateway
│   ├── alerts/                        # Active & Resolved Alerts Dashboard
│   ├── dashboard/                     # Main Facility Operations Overview
│   ├── devices/                       # IoT Device Registry & Status
│   ├── insights/                      # Predictive Analytics & Baselines
│   ├── locations/                     # Building & Campus Hierarchy
│   ├── reports/                       # Sustainability & Audit Reports
│   ├── round2/                        # Resource Intelligence & Explainability Module
│   ├── security/                      # Realtime Cybersecurity Posture Center
│   ├── water/                         # Live Water Telemetry View (MVP)
│   ├── globals.css                    # Design Tokens & Global CSS
│   └── layout.tsx                     # App Shell Root Layout
├── components/                        # Reusable UI & Layout Components
│   ├── layout/                        # Sidebar, Header, AppShell
│   └── ui/                            # Buttons, Cards, Badges, Metrics
├── data/                              # Mock Data & Campus Profiles
│   └── mock-data.ts
├── firmware/                          # Microcontroller Firmware
│   └── esp32_water_node/
│       ├── esp32_water_node.ino       # Core Arduino / ESP32 Sketch
│       ├── config.h                   # Wi-Fi, Pinout & Server Configuration
│       ├── secrets.example.h          # Template for Wi-Fi & Device Credentials
│       ├── TelemetryTransport.h       # HTTP/HTTPS Ingest Transport Header
│       ├── TelemetryTransport.cpp     # Transport Implementation & Fallbacks
│       └── README.md                  # Firmware Flashing Guide & Pinouts
├── lib/                               # Core Logic & Utilities
│   ├── ai/                            # Intelligence & Explainability Engine
│   │   ├── anomaly-rules.ts           # Heuristic Detection Rules
│   │   ├── baseline-profiler.ts       # Diurnal Gaussian Baseline Profiler
│   │   ├── explainability.ts          # Actionable Recommendation Generator
│   │   ├── risk-scorer.ts             # Composite 0-100 Risk Scorer
│   │   └── water-engine.ts            # Master Intelligence Orchestrator
│   ├── security.ts                    # SHA-256 Hashing, Rate Limiting & Validation
│   ├── security-events.ts             # Session Event Logger
│   ├── supabase.ts                    # Supabase Client Initialization
│   └── use-telemetry.ts               # Live Telemetry React Hook
├── supabase/                          # Database Schemas & Migrations
│   ├── migrations/                    # SQL Schemas & RLS Policies
│   └── seed.sql                       # Initial Seed Data
├── types/                             # TypeScript Type Definitions
│   └── index.ts
├── .env.example                       # Environment Variable Template
├── .gitignore                         # Secret & Artifact Exclusion Rules
├── next.config.ts                     # Next.js Build Configuration
├── package.json                       # Project Dependencies & Scripts
├── tsconfig.json                      # TypeScript Configuration
└── SECURITY.md                        # Formal Cybersecurity & Privacy Policy
```

---

## 11. Running Locally

### Prerequisites
- **Node.js**: `v18+` or `v20+`
- **npm**: `v9+` or `v10+`

### Installation & Development

```bash
# 1. Clone the repository
git clone https://github.com/Aswanth-app/EcoCampus_AI.git
cd EcoCampus_AI

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env.local

# 4. Start local development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Available Scripts (from `package.json`)
- `npm run dev`: Starts the Next.js development server.
- `npm run build`: Compiles the TypeScript application for production.
- `npm run start`: Starts the compiled production server.
- `npm run lint`: Runs ESLint checks across the codebase.

### Environment Variables Required
The application uses the following environment variables (defined in `.env.example`):
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL (browser accessible).
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anonymous publishable key (browser accessible).
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role administrative key (server-only).
- `DEVICE_API_KEY`: Pre-shared device ingestion authentication key (server-only).

*(Never commit actual secrets or `.env.local` files to source control).*

---

## 12. Live Deployment

- **Cloud Platform**: Deployed on Vercel Edge Network
- **Live Application URL**: [https://eco-campus-ai-nine.vercel.app](https://eco-campus-ai-nine.vercel.app)

---

## 13. Current Status & Readiness

| Layer | Status | Implementation Details |
|---|---|---|
| **Web Dashboard** | **Implemented** | Next.js 16 app with Overview, Live Water, Resource Intelligence, Security Posture, and Device pages. |
| **Intelligence Engine** | **Implemented** | Heuristic rules, Gaussian diurnal profiler, composite risk scorer, and recommendation generator. |
| **API Ingestion & Security** | **Implemented** | Secure ingestion endpoint with SHA-256 authentication, timing-safe checks, rate limiting, and schema validation. |
| **ESP32 Firmware** | **Implemented** | Arduino C++ firmware with hardware interrupts, SNTP time sync, and HTTPS transmission. |
| **Database & Realtime** | **Implemented** | Supabase PostgreSQL schema with RLS and seed datasets. |
| **Hardware Sensor** | **Prototype** | Benchtop testing with YF-S201 inline Hall sensor. Full campus deployment requires clamp-on ultrasonic meters. |

---

## 14. Future Scope & Roadmap

1. **External Clamp-On Ultrasonic Sensor Pilot**: Transition from inline benchtop sensors to non-invasive external clamp-on transit-time meters for building-level water mains.
2. **Campus-Wide Block Deployment**: Scale inlet monitoring across all academic, hostel, and athletic facilities.
3. **Integrated Occupancy & PIR Sensors**: Pair water flow nodes with ambient PIR / BLE occupancy beacons to refine activity detection.
4. **Enhanced Historical Learning**: Implement machine-learning baselines (Isolation Forest) trained on longitudinal multi-semester consumption data.
5. **Real-World Field Validation & Calibration**: Measure avoided water loss and financial ROI across real campus pipe networks.
6. **Automated Valve Actuation**: Integrate LoRaWAN motorized shut-off valves for automatic isolation of severe main bursts.

---

## 15. Repository & Project Information

- **Repository**: [https://github.com/Aswanth-app/EcoCampus_AI](https://github.com/Aswanth-app/EcoCampus_AI)
- **Organization / Author**: Aswanth-app
- **Project Domain**: Sustainable Campus Resource Intelligence & Anomaly Detection

---

## 16. License

This repository is private and proprietary. All rights reserved by the project authors.
