"use client";

import React, { useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  Droplets,
  Activity,
  Layers,
  Cpu,
  ShieldCheck,
  HelpCircle,
  Clock,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Search,
  Sliders,
  Lock,
  Wifi,
  Database,
  Building2,
  Award,
  Zap,
  Check,
  AlertCircle,
  Server,
  TrendingDown,
  Info,
  Eye,
} from "lucide-react";

// ==========================================
// SCENARIO DATA
// ==========================================
type ScenarioType = "scenario_a" | "scenario_b";

interface ScenarioData {
  id: ScenarioType;
  title: string;
  subtitle: string;
  flowRateLpm: number;
  durationSeconds: number;
  activityDetected: boolean;
  timeOfDay: string;
  timeType: "Peak Morning Activity" | "Off-Peak / Quiescent Night";
  location: string;
  historicalBaselineLpm: number;
  result: "Normal Usage" | "High Waste Risk";
  riskScore: number;
  riskLevel: "LOW" | "CRITICAL";
  recommendation: string;
  reason: string;
  litersConsumed: number;
}

const SCENARIOS: Record<ScenarioType, ScenarioData> = {
  scenario_a: {
    id: "scenario_a",
    title: "Scenario A: Normal Handwashing",
    subtitle: "Standard daytime student usage in academic block restroom",
    flowRateLpm: 2.5,
    durationSeconds: 20,
    activityDetected: true,
    timeOfDay: "8:00 AM",
    timeType: "Peak Morning Activity",
    location: "Hostel Block A - Floor 2 Washroom",
    historicalBaselineLpm: 3.2,
    result: "Normal Usage",
    riskScore: 12,
    riskLevel: "LOW",
    recommendation: "No action required. Telemetry conforms to transient handwashing baseline.",
    reason: "Short 20s burst matching active morning occupancy patterns. Flow rate within regular municipal fixture rating.",
    litersConsumed: (2.5 / 60) * 20, // 0.83 L
  },
  scenario_b: {
    id: "scenario_b",
    title: "Scenario B: Tap Left Open",
    subtitle: "Continuous unattended running tap during quiescent early morning hours",
    flowRateLpm: 2.5,
    durationSeconds: 600, // 10 minutes
    activityDetected: false,
    timeOfDay: "2:00 AM",
    timeType: "Off-Peak / Quiescent Night",
    location: "Hostel Block A - Ground Floor Common Area",
    historicalBaselineLpm: 0.1,
    result: "High Waste Risk",
    riskScore: 94,
    riskLevel: "CRITICAL",
    recommendation: "Check unattended water usage. Alert dispatched to floor facility warden.",
    reason: "Continuous 10-minute flow during deep-night quiescent window (2:00 AM) with zero detected occupancy activity.",
    litersConsumed: (2.5 / 60) * 600, // 25.0 L
  },
};

// ==========================================
// JUDGE QUESTIONS DATABASE (12 Questions)
// ==========================================
interface JudgeQA {
  id: string;
  question: string;
  category: "detection" | "architecture" | "hardware" | "security" | "business";
  shortAnswer: string;
  keyPoints: string[];
}

const JUDGE_QUESTIONS: JudgeQA[] = [
  {
    id: "q1",
    question: "How do you distinguish normal handwashing from a tap left open?",
    category: "detection",
    shortAnswer:
      "EcoCampus AI uses multi-dimensional contextual evaluation combining flow duration, time-of-day diurnal patterns, occupancy signals, and location baselines rather than a single static flow threshold.",
    keyPoints: [
      "Normal handwashing runs at ~2.5 L/min for 15-30s during active daytime hours (8 AM - 10 PM).",
      "A tap left open has the identical 2.5 L/min flow rate, but persists for 10+ minutes during deep night (2 AM) without occupancy.",
      "By correlating Flow × Duration × Time × Activity, the model flags the 10-minute unattended tap with 94% risk while approving the 20-second handwash.",
    ],
  },
  {
    id: "q2",
    question: "Will you install one sensor per tap?",
    category: "architecture",
    shortAnswer:
      "No. We follow a hierarchical, block-level deployment starting with one primary inlet flow sensor per building block rather than individual fixtures.",
    keyPoints: [
      "Installing sensors on hundreds of individual taps is cost-prohibitive and difficult to maintain.",
      "A single inlet sensor continuously monitors entire block aggregate consumption and baseline night flows.",
      "High-risk sub-zones (e.g. commercial kitchens, laboratories, specific washroom risers) only receive targeted secondary sensors when anomalies persist.",
    ],
  },
  {
    id: "q3",
    question: "How will you control deployment cost?",
    category: "business",
    shortAnswer:
      "By adopting an inlet-first top-down architecture, using low-cost ESP32 microcontrollers ($4-6), and transitioning to clamp-on ultrasonic sensors for zero-downtime non-invasive installation.",
    keyPoints: [
      "Inlet-first monitoring reduces sensor density by >85% compared to fixture-level monitoring.",
      "ESP32 nodes operate on standard campus Wi-Fi, eliminating expensive proprietary field-bus cabling.",
      "Cloud backend leverages serverless ingest and shared edge aggregation, minimizing operational overhead.",
    ],
  },
  {
    id: "q4",
    question: "How will the system scale to the entire campus?",
    category: "architecture",
    shortAnswer:
      "Each campus facility is partitioned hierarchically (Campus → Block → Risers/Nodes). Every ESP32 node has a unique cryptographic identity and sends partitioned telemetry.",
    keyPoints: [
      "New campus blocks can be provisioned in minutes by flashing an ESP32 node with unique credentials.",
      "The database schema is partitioned location-wise and device-wise (`building_id`, `node_uid`).",
      "The dashboard dynamically aggregates metrics across blocks, comparing per-student and per-sqm water benchmarks.",
    ],
  },
  {
    id: "q5",
    question: "Why is AI needed instead of a fixed threshold?",
    category: "detection",
    shortAnswer:
      "Fixed thresholds generate excessive false positives and miss stealth leaks because normal campus water demands fluctuate widely across hours, days, and facility types.",
    keyPoints: [
      "A static threshold of 5 L/min fails: it flags high legitimate rush-hour cafeteria usage as a leak, yet ignores a 2 L/min leak running all night.",
      "Our AI layer (Isolation Forest & learned Gaussian baselines) adapts to circadian usage rhythms.",
      "It outputs multidimensional explainability: numerical risk score (0-100), root cause, and prescriptive actions.",
    ],
  },
  {
    id: "q6",
    question: "What happens if Wi-Fi fails?",
    category: "hardware",
    shortAnswer:
      "The ESP32 firmware features non-blocking Wi-Fi reconnection state machines, local SPIFFS/NVS ring buffering for unsent telemetry, and auto-recovery.",
    keyPoints: [
      "Continuous pulse counting is handled by hardware timer/interrupts on the ESP32, ensuring zero missed volume during network outages.",
      "Telemetry packets are cached locally with timestamps and flushed in chronological batches upon Wi-Fi restoration.",
      "The backend monitors device freshness; if heartbeats cease for >120s, the dashboard flags the node as 'Standby / Offline' with zero false leak alerts.",
    ],
  },
  {
    id: "q7",
    question: "Is the current sensor inline or clamp-on?",
    category: "hardware",
    shortAnswer:
      "The current prototype utilizes a YF-S201 inline turbine flow sensor for benchtop validation. Our commercial production pilot roadmap specifies non-invasive external clamp-on ultrasonic sensors.",
    keyPoints: [
      "Current prototype: YF-S201 inline Hall-effect turbine sensor (calibrated at 7.5 Hz/LPM, requires pipe incision).",
      "Future pilot: Compact external clamp-on ultrasonic transit-time sensor (zero pipe cuts, zero contamination, installs in <5 minutes).",
      "We never misrepresent the benchtop YF-S201 as a clamp-on sensor.",
    ],
  },
  {
    id: "q8",
    question: "How will the system work in a real campus?",
    category: "architecture",
    shortAnswer:
      "Block main inlets continuously transmit 5-second flow aggregates over campus Wi-Fi to our cloud API. The AI engine flags anomalies and sends automated SMS/dashboard alerts to on-duty facility wardens.",
    keyPoints: [
      "1. Sensor nodes report continuous flow and cumulative liters to secure endpoints.",
      "2. Serverless ingestion validates device identity, bounds, and rate limits.",
      "3. The anomaly engine evaluates multi-parameter rules in real time.",
      "4. Facility teams receive actionable tickets with exact block and root cause recommendations.",
    ],
  },
  {
    id: "q9",
    question: "How will you prevent unauthorized devices from sending data?",
    category: "security",
    shortAnswer:
      "Through a defense-in-depth security suite: cryptographic API keys, hardware UID validation, JSON schema validation, IP rate limiting, and in-memory audit logs.",
    keyPoints: [
      "Every request must provide a valid `x-api-key` header and pre-registered `device_uid`.",
      "Incoming payloads undergo strict numeric bounds checking (flow rate 0–120 L/min, pulses >= 0).",
      "Token-bucket rate limiters reject rapid spoofed floods with HTTP 429.",
      "Audit logs record all rejected ingestion attempts with source telemetry metadata.",
    ],
  },
  {
    id: "q10",
    question: "Is the demo data real or simulated?",
    category: "business",
    shortAnswer:
      "Our water page is wired to physical ESP32 hardware and Supabase. On this explainability tab, scenarios are explicitly simulated to demonstrate decision-making logic without polluting production telemetry.",
    keyPoints: [
      "Live Hardware: Physical ESP32 + YF-S201 live telemetry flows to `public.telemetry` on Supabase.",
      "Explainability Scenarios: Isolated simulations showing the AI decision engine's multi-factor logic.",
      "Zero Fake DB Writes: Simulated demo interactions do not overwrite or modify live telemetry records.",
    ],
  },
  {
    id: "q11",
    question: "What is the future improvement?",
    category: "business",
    shortAnswer:
      "Upgrading to clamp-on ultrasonic sensors, edge-ML on ESP32-S3 for offline inference, automated motorized shut-off solenoid valves, and campus BMS (Building Management System) BACnet integration.",
    keyPoints: [
      "Ultrasonic Clamp-on: Non-intrusive mass deployment across multi-inch main risers.",
      "Edge-AI: Running quantized TinyML models directly on ESP32-S3 nodes for zero-latency local detection.",
      "Automated Actuation: LoRaWAN-connected motorized ball valves for instant automated shut-off during major burst leaks.",
    ],
  },
  {
    id: "q12",
    question: "How will you measure water savings?",
    category: "business",
    shortAnswer:
      "By tracking the Delta between actual post-deployment consumption and pre-pilot historical baseline volume, combined with avoided volume calculations from rapid anomaly resolution.",
    keyPoints: [
      "Avoided Volume = (Leak Flow Rate L/min) × (Historical Mean Resolution Time - EcoCampus AI Instant Detection Time).",
      "Baseline Tracking: Comparing per-capita daily liters (Litres Per Capita Daily - LPCD) across semesters.",
      "Financial ROI: Multiplying saved kilo-liters by municipal water and pumping energy tariffs.",
    ],
  },
];

export default function Round2DemoPage() {
  const [selectedScenario, setSelectedScenario] = useState<ScenarioType>("scenario_a");
  const [activeTab, setActiveTab] = useState<
    "scenarios" | "architecture" | "sensors" | "ai" | "scale" | "security" | "integrity" | "qa"
  >("scenarios");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [expandedQAs, setExpandedQAs] = useState<Record<string, boolean>>({ q1: true, q2: true });

  const scenario = SCENARIOS[selectedScenario];

  const toggleQA = (id: string) => {
    setExpandedQAs((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredQAs = JUDGE_QUESTIONS.filter((qa) => {
    const matchesCat = selectedCategory === "all" || qa.category === selectedCategory;
    const matchesSearch =
      qa.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      qa.shortAnswer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      qa.keyPoints.some((p) => p.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  return (
    <AppShell>
      {/* Breadcrumb Context */}
      <Breadcrumb
        items={[
          { label: "Eco Flux University" },
          { label: "Round 2 Hackathon", href: "/round2" },
          { label: "Demo & Explainability" },
        ]}
      />

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-[#064E3B] via-[#0B6B4F] to-[#0A523D] p-6 rounded-2xl text-white shadow-sm border border-emerald-800">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-400/20 text-emerald-200 text-xs font-bold uppercase tracking-wider border border-emerald-300/30 flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-emerald-300" />
              Round 2 Evaluation Suite
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-cyan-400/20 text-cyan-200 text-xs font-bold uppercase tracking-wider border border-cyan-300/30">
              Interactive Judge Toolkit
            </span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Round 2 Demo &amp; Explainability
          </h2>
          <p className="text-emerald-100/80 text-sm mt-1 max-w-2xl leading-relaxed">
            Interactive multi-factor water intelligence demonstration, block deployment architecture, sensor roadmap, and technical FAQ reference.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            className="border-emerald-300/30 bg-emerald-900/40 text-emerald-100 hover:bg-emerald-800 hover:text-white"
            onClick={() => setActiveTab("qa")}
          >
            <HelpCircle className="w-4 h-4 mr-1.5 text-emerald-300" />
            Judge Q&amp;A Panel
          </Button>
          <Button
            variant="primary"
            size="sm"
            className="bg-emerald-400 text-emerald-950 hover:bg-emerald-300 font-semibold"
            onClick={() => (window.location.href = "/water")}
          >
            <Activity className="w-4 h-4 mr-1.5" />
            Live Water MVP
          </Button>
        </div>
      </div>

      {/* Quick Access Navigation Tabs */}
      <div className="bg-white rounded-xl border border-gray-200 p-1.5 shadow-xs overflow-x-auto">
        <div className="flex items-center gap-1 min-w-max text-xs">
          {[
            { id: "scenarios", label: "1. Waste Detection Demo", icon: Droplets },
            { id: "architecture", label: "2. Block Strategy", icon: Building2 },
            { id: "sensors", label: "3. Sensor Roadmap", icon: Cpu },
            { id: "ai", label: "4. Why AI Is Needed", icon: Sparkles },
            { id: "scale", label: "5. Campus Scalability", icon: Layers },
            { id: "security", label: "6. Security & Reliability", icon: ShieldCheck },
            { id: "integrity", label: "7. Live vs Simulation", icon: Database },
            { id: "qa", label: "8. Judge Q&A (12)", icon: HelpCircle },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-medium transition-all ${
                  isActive
                    ? "bg-[#0B6B4F] text-white shadow-xs font-semibold"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-emerald-200" : "text-gray-400"}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ======================================================== */}
      {/* SECTION 1: CONTEXT-AWARE WATER WASTE DETECTION DEMO */}
      {/* ======================================================== */}
      {(activeTab === "scenarios" || activeTab === "ai") && (
        <div className="space-y-6">
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-gray-200">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-emerald-100 text-[#0B6B4F] font-bold text-xs flex items-center justify-center">
                  1
                </span>
                <h3 className="text-lg font-bold text-gray-900">Context-Aware Water Waste Detection</h3>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                The EcoCampus AI decision engine does not rely solely on raw flow rate. It fuses multi-factor contextual telemetry.
              </p>
            </div>

            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg text-[11px] text-amber-900">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Simulated Demonstration:</strong> Does not modify live database records.
              </span>
            </div>
          </div>

          {/* Context Factors Visual Pill Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { title: "Flow Rate", desc: "Hall pulse frequency (L/min)", icon: Activity, color: "text-emerald-700 bg-emerald-50 border-emerald-200" },
              { title: "Flow Duration", desc: "Continuous elapsed seconds", icon: Clock, color: "text-teal-700 bg-teal-50 border-teal-200" },
              { title: "Time of Day", desc: "Diurnal curve (AM/PM)", icon: Clock, color: "text-blue-700 bg-blue-50 border-blue-200" },
              { title: "Activity Context", desc: "Restroom PIR occupancy", icon: Eye, color: "text-purple-700 bg-purple-50 border-purple-200" },
              { title: "Historical Baseline", desc: "Quiescent vs peak profile", icon: Database, color: "text-indigo-700 bg-indigo-50 border-indigo-200" },
              { title: "Location Context", desc: "Hostel vs Academic vs Lab", icon: MapPin, color: "text-cyan-700 bg-cyan-50 border-cyan-200" },
            ].map((f, i) => {
              const Icon = f.icon;
              return (
                <div key={i} className={`p-3 rounded-xl border flex flex-col justify-between ${f.color}`}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-bold">{f.title}</span>
                    <Icon className="w-3.5 h-3.5 opacity-80" />
                  </div>
                  <p className="text-[10px] opacity-80 leading-tight">{f.desc}</p>
                </div>
              );
            })}
          </div>

          {/* Interactive Scenario Selection Controller */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
              <div>
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Interactive Evaluation Sandbox
                </span>
                <h4 className="text-base font-bold text-gray-900">
                  Compare Identical Flow Rates (2.5 L/min) in Different Contexts
                </h4>
              </div>

              {/* Scenario Toggle Buttons */}
              <div className="flex items-center gap-2 p-1.5 bg-gray-100 rounded-xl">
                <button
                  onClick={() => setSelectedScenario("scenario_a")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                    selectedScenario === "scenario_a"
                      ? "bg-white text-emerald-800 shadow-xs border border-gray-200"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <CheckCircle2 className={`w-4 h-4 ${selectedScenario === "scenario_a" ? "text-emerald-600" : "text-gray-400"}`} />
                  Scenario A: Normal Handwash
                </button>

                <button
                  onClick={() => setSelectedScenario("scenario_b")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                    selectedScenario === "scenario_b"
                      ? "bg-white text-red-700 shadow-xs border border-gray-200"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <AlertTriangle className={`w-4 h-4 ${selectedScenario === "scenario_b" ? "text-red-600" : "text-gray-400"}`} />
                  Scenario B: Tap Left Open
                </button>
              </div>
            </div>

            {/* Current Scenario Live Breakdown Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left 2 Cols: Context Inputs & Real-time Evaluation */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-700">{scenario.title}</span>
                  <Badge variant={scenario.riskLevel === "CRITICAL" ? "critical" : "normal"}>
                    {scenario.result}
                  </Badge>
                </div>

                {/* Telemetry Context Parameters Table / Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-gray-50 border border-gray-200">
                    <span className="text-[10px] text-gray-500 font-medium block">Measured Flow Rate</span>
                    <span className="text-lg font-bold text-gray-900 font-mono mt-0.5 block">
                      {scenario.flowRateLpm.toFixed(1)} <span className="text-xs font-sans font-normal text-gray-500">L/min</span>
                    </span>
                    <span className="text-[10px] text-emerald-700 font-medium">Both scenarios identical</span>
                  </div>

                  <div className={`p-3 rounded-xl border ${scenario.durationSeconds > 60 ? "bg-red-50 border-red-200" : "bg-gray-50 border-gray-200"}`}>
                    <span className="text-[10px] text-gray-500 font-medium block">Flow Duration</span>
                    <span className={`text-lg font-bold font-mono mt-0.5 block ${scenario.durationSeconds > 60 ? "text-red-700" : "text-gray-900"}`}>
                      {scenario.durationSeconds >= 60 ? `${scenario.durationSeconds / 60} mins` : `${scenario.durationSeconds} secs`}
                    </span>
                    <span className="text-[10px] text-gray-500">{scenario.durationSeconds > 60 ? "Abnormal persistence" : "Transient pulse"}</span>
                  </div>

                  <div className={`p-3 rounded-xl border ${scenario.timeOfDay.includes("2:00 AM") ? "bg-amber-50 border-amber-200" : "bg-gray-50 border-gray-200"}`}>
                    <span className="text-[10px] text-gray-500 font-medium block">Time of Day</span>
                    <span className="text-lg font-bold text-gray-900 font-mono mt-0.5 block">
                      {scenario.timeOfDay}
                    </span>
                    <span className="text-[10px] text-gray-600">{scenario.timeType}</span>
                  </div>

                  <div className={`p-3 rounded-xl border ${!scenario.activityDetected ? "bg-red-50 border-red-200" : "bg-emerald-50 border-emerald-200"}`}>
                    <span className="text-[10px] text-gray-500 font-medium block">Occupancy Activity</span>
                    <span className={`text-sm font-bold mt-1 block flex items-center gap-1.5 ${scenario.activityDetected ? "text-emerald-800" : "text-red-700"}`}>
                      {scenario.activityDetected ? <Check className="w-4 h-4 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 text-red-600" />}
                      {scenario.activityDetected ? "Detected (Active)" : "Zero Motion (Unattended)"}
                    </span>
                    <span className="text-[10px] text-gray-500">PIR Restroom context</span>
                  </div>

                  <div className="p-3 rounded-xl bg-gray-50 border border-gray-200">
                    <span className="text-[10px] text-gray-500 font-medium block">Historical Baseline</span>
                    <span className="text-lg font-bold text-gray-900 font-mono mt-0.5 block">
                      {scenario.historicalBaselineLpm.toFixed(1)} <span className="text-xs font-sans font-normal text-gray-500">L/min</span>
                    </span>
                    <span className="text-[10px] text-gray-500">Learned profile for hour</span>
                  </div>

                  <div className="p-3 rounded-xl bg-gray-50 border border-gray-200">
                    <span className="text-[10px] text-gray-500 font-medium block">Water Discharged</span>
                    <span className={`text-lg font-bold font-mono mt-0.5 block ${scenario.litersConsumed > 5 ? "text-red-700" : "text-emerald-700"}`}>
                      {scenario.litersConsumed.toFixed(2)} <span className="text-xs font-sans font-normal text-gray-500">Liters</span>
                    </span>
                    <span className="text-[10px] text-gray-500">Cumulative volume</span>
                  </div>
                </div>

                {/* AI Reasoning Box */}
                <div className={`p-4 rounded-xl border text-xs leading-relaxed ${
                  scenario.riskLevel === "CRITICAL"
                    ? "bg-red-50/80 border-red-200 text-red-950"
                    : "bg-emerald-50/80 border-emerald-200 text-emerald-950"
                }`}>
                  <div className="flex items-start gap-2.5">
                    <Sparkles className={`w-4 h-4 shrink-0 mt-0.5 ${scenario.riskLevel === "CRITICAL" ? "text-red-600" : "text-emerald-600"}`} />
                    <div>
                      <span className="font-bold block mb-0.5">Engine Explainability Analysis:</span>
                      <p className="mb-2">{scenario.reason}</p>
                      <div className="pt-2 border-t border-gray-200/60 font-semibold flex items-center gap-1.5">
                        <ArrowRight className="w-3.5 h-3.5" />
                        <span>Prescriptive Recommendation: {scenario.recommendation}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Col: Risk Score Gauge & Decision Card */}
              <div className="p-5 rounded-2xl bg-gray-50 border border-gray-200 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Context-Aware Anomaly Score
                  </span>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className={`text-4xl font-black font-mono tracking-tight ${
                      scenario.riskScore > 50 ? "text-red-600" : "text-emerald-700"
                    }`}>
                      {scenario.riskScore}
                    </span>
                    <span className="text-xs text-gray-500 font-bold">/ 100 Risk</span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-gray-200 h-2.5 rounded-full mt-3 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        scenario.riskScore > 50 ? "bg-red-600" : "bg-emerald-600"
                      }`}
                      style={{ width: `${scenario.riskScore}%` }}
                    />
                  </div>

                  <div className="mt-4 space-y-2 text-xs text-gray-600 border-t border-gray-200 pt-3">
                    <div className="flex items-center justify-between">
                      <span>Anomaly Status:</span>
                      <strong className={scenario.riskLevel === "CRITICAL" ? "text-red-700" : "text-emerald-700"}>
                        {scenario.riskLevel === "CRITICAL" ? "ANOMALOUS EVENT" : "NORMAL CONFORMANT"}
                      </strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Facility Warden Alert:</span>
                      <strong>{scenario.riskLevel === "CRITICAL" ? "Dispatched" : "Suppressed (Normal)"}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Threshold Baseline:</span>
                      <span>Circadian + PIR Adaptive</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-200">
                  <span className="text-[10px] text-gray-400 block text-center">
                    Simulated Sandbox Mode • Zero Database Side Effects
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Decision Flow Pipeline Diagram */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-4">
            <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#0B6B4F]" />
              <span>Multi-Factor Visual Decision Flow Architecture</span>
            </h4>
            <p className="text-xs text-gray-500">
              Step-by-step logic pipeline executed on every incoming telemetry pulse batch:
            </p>

            {/* Step Pipeline */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2 pt-2">
              {[
                { step: "1", title: "Flow Sensor", subtitle: "2.5 L/min Pulse", icon: Droplets, color: "border-emerald-300 bg-emerald-50 text-emerald-800" },
                { step: "2", title: "Flow Duration", subtitle: "20s vs 10min", icon: Clock, color: "border-teal-300 bg-teal-50 text-teal-800" },
                { step: "3", title: "Time Context", subtitle: "8 AM vs 2 AM", icon: Clock, color: "border-blue-300 bg-blue-50 text-blue-800" },
                { step: "4", title: "Activity Context", subtitle: "PIR Occupancy", icon: Eye, color: "border-purple-300 bg-purple-50 text-purple-800" },
                { step: "5", title: "Historical Base", subtitle: "Gaussian Bounds", icon: Database, color: "border-indigo-300 bg-indigo-50 text-indigo-800" },
                { step: "6", title: "Context AI", subtitle: "Isolation Forest", icon: Sparkles, color: "border-amber-300 bg-amber-50 text-amber-800" },
                { step: "7", title: "Result Output", subtitle: "Risk Score 0-100", icon: Activity, color: "border-rose-300 bg-rose-50 text-rose-800" },
                { step: "8", title: "Action", subtitle: "Ticket / Warden", icon: ShieldCheck, color: "border-emerald-400 bg-emerald-100 text-emerald-900" },
              ].map((step, idx) => {
                const Icon = step.icon;
                return (
                  <div key={idx} className={`p-3 rounded-xl border flex flex-col justify-between text-center relative ${step.color}`}>
                    <div className="w-5 h-5 rounded-full bg-white/80 font-bold text-[10px] mx-auto mb-1 flex items-center justify-center shadow-xs">
                      {step.step}
                    </div>
                    <Icon className="w-4 h-4 mx-auto my-1" />
                    <div>
                      <p className="text-xs font-bold leading-tight">{step.title}</p>
                      <p className="text-[10px] opacity-75 mt-0.5">{step.subtitle}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SECTION 2: BLOCK-LEVEL DEPLOYMENT STRATEGY */}
      {/* ======================================================== */}
      {(activeTab === "architecture" || activeTab === "scale") && (
        <div className="space-y-6">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
            <span className="w-6 h-6 rounded-full bg-emerald-100 text-[#0B6B4F] font-bold text-xs flex items-center justify-center">
              2
            </span>
            <h3 className="text-lg font-bold text-gray-900">Block-Level Deployment Strategy</h3>
          </div>

          {/* Visual Architecture Diagram */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#0B6B4F]" />
                <span>End-to-End Hierarchical Architecture Pipeline</span>
              </h4>
              <Badge variant="normal">Cost-Optimized Pilot Model</Badge>
            </div>

            {/* Architecture Path Flow */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2.5 pt-2">
              {[
                { node: "Campus", desc: "Main Campus Grounds", icon: Building2, tag: "Scope" },
                { node: "Block Inlet Sensor", desc: "1 Sensor per Building", icon: Droplets, tag: "Hardware" },
                { node: "ESP32 Node", desc: "Edge Pulse Counter", icon: Cpu, tag: "Edge Micro" },
                { node: "Wi-Fi / Backend", desc: "TLS Ingestion API", icon: Wifi, tag: "Transport" },
                { node: "Dashboard", desc: "EcoCampus Web Portal", icon: Activity, tag: "UI / Ops" },
                { node: "Anomaly Engine", desc: "Multi-Rule AI Layer", icon: Sparkles, tag: "Intelligence" },
                { node: "Risk Score", desc: "0-100 Severity Index", icon: Layers, tag: "Scoring" },
                { node: "Action / Ticket", desc: "Warden Notification", icon: ShieldCheck, tag: "Resolution" },
              ].map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div key={idx} className="p-3.5 rounded-xl border border-gray-200 bg-gray-50/70 hover:bg-emerald-50/50 hover:border-emerald-300 transition-all flex flex-col justify-between text-center group">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400 group-hover:text-emerald-700">
                      {item.tag}
                    </span>
                    <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 mx-auto my-2 flex items-center justify-center text-[#0B6B4F] shadow-xs group-hover:bg-[#0B6B4F] group-hover:text-white transition-colors">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-900 group-hover:text-[#0B6B4F]">{item.node}</p>
                      <p className="text-[10px] text-gray-500 mt-0.5 leading-tight">{item.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Block Strategy Detailed Explanations */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-100">
              <Card className="bg-emerald-50/40 border-emerald-200 p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <h5 className="text-xs font-bold text-emerald-950">Inlet-First Initial Pilot</h5>
                </div>
                <p className="text-xs text-gray-700 leading-relaxed">
                  Instead of installing hundreds of fragile sensors at every individual faucet, the initial deployment installs <strong>one high-capacity sensor at the primary water inlet of each block</strong>.
                </p>
              </Card>

              <Card className="bg-blue-50/40 border-blue-200 p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-blue-100 text-blue-800">
                    <Layers className="w-4 h-4" />
                  </div>
                  <h5 className="text-xs font-bold text-blue-950">Selective Sub-Zone Expansion</h5>
                </div>
                <p className="text-xs text-gray-700 leading-relaxed">
                  Secondary riser sensors or tap-level sensors are deployed <strong>only in identified high-risk zones</strong> (e.g. cafeteria kitchens, science laboratories, or repeat leak zones).
                </p>
              </Card>

              <Card className="bg-teal-50/40 border-teal-200 p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-teal-100 text-teal-800">
                    <TrendingDown className="w-4 h-4" />
                  </div>
                  <h5 className="text-xs font-bold text-teal-950">85%+ CapEx Reduction</h5>
                </div>
                <p className="text-xs text-gray-700 leading-relaxed">
                  This targeted deployment slashes upfront hardware and maintenance costs while delivering 100% aggregate water monitoring and instant leak localization across campus.
                </p>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SECTION 3: CURRENT PROTOTYPE VS FUTURE PILOT SENSOR */}
      {/* ======================================================== */}
      {(activeTab === "sensors" || activeTab === "architecture") && (
        <div className="space-y-6">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
            <span className="w-6 h-6 rounded-full bg-emerald-100 text-[#0B6B4F] font-bold text-xs flex items-center justify-center">
              3
            </span>
            <h3 className="text-lg font-bold text-gray-900">Current Prototype vs Future Pilot Sensor</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Current Prototype Card */}
            <Card className="p-6 border-l-4 border-l-amber-500 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <Badge variant="warning">Current Prototype</Badge>
                    <h4 className="text-base font-bold text-gray-900 mt-2">
                      YF-S201 Inline Flow Sensor
                    </h4>
                    <p className="text-xs text-gray-500">Benchtop &amp; Lab Validation Hardware</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
                    <Cpu className="w-6 h-6" />
                  </div>
                </div>

                <div className="space-y-2.5 text-xs text-gray-700 leading-relaxed">
                  <div className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span><strong>Working Principle:</strong> Hall-effect rotor turbine pulse generation (7.5 Hz per L/min calibration).</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span><strong>Installation:</strong> Requires physical inline pipe cut and plumbing coupling.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span><strong>Purpose:</strong> Accurate prototype verification, telemetry stream benchmarking, and algorithm development.</span>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-amber-50/70 border border-amber-200 text-xs text-amber-950 font-medium">
                <strong>Honest Technical Distinction:</strong> YF-S201 is strictly an inline sensor. It is never misrepresented as an external clamp-on device.
              </div>
            </Card>

            {/* Future Pilot Sensor Card */}
            <Card className="p-6 border-l-4 border-l-[#0B6B4F] flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <Badge variant="normal">Future Commercial Pilot</Badge>
                    <h4 className="text-base font-bold text-gray-900 mt-2">
                      Compact External Clamp-On Ultrasonic Sensor
                    </h4>
                    <p className="text-xs text-gray-500">Non-Invasive Production Scale Deployment</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-emerald-50 text-[#0B6B4F] border border-emerald-200">
                    <Zap className="w-6 h-6" />
                  </div>
                </div>

                <div className="space-y-2.5 text-xs text-gray-700 leading-relaxed">
                  <div className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Working Principle:</strong> Ultrasonic transit-time differential acoustic flow measurement.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Zero Plumbing Interruption:</strong> Clamps directly outside existing copper, PVC, or GI pipes without cutting.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Rapid Campus Rollout:</strong> 5-minute clamp-on installation per block without shutting off water mains.</span>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-950 font-medium">
                <strong>Scale Advantage:</strong> Zero pipe corrosion, zero mechanical wear, zero particulate clogging, and 10+ year field lifetime.
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SECTION 4: WHY AI IS NEEDED */}
      {/* ======================================================== */}
      {(activeTab === "ai" || activeTab === "scenarios") && (
        <div className="space-y-6">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
            <span className="w-6 h-6 rounded-full bg-emerald-100 text-[#0B6B4F] font-bold text-xs flex items-center justify-center">
              4
            </span>
            <h3 className="text-lg font-bold text-gray-900">Why AI Is Needed (Beyond Simple Fixed Thresholds)</h3>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Limitation of Fixed Thresholds */}
            <Card className="p-6 border-red-200 bg-red-50/20 space-y-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <h4 className="text-sm font-bold text-red-950">Why Fixed Thresholds Fail on Campuses</h4>
              </div>

              <p className="text-xs text-gray-700 leading-relaxed">
                Campus water demand is highly dynamic: a single fixed threshold (e.g. <em>&quot;Alert if flow &gt; 5 L/min&quot;</em>) suffers from fatal flaws:
              </p>

              <div className="space-y-2 text-xs text-gray-700">
                <div className="p-2.5 rounded-lg bg-white border border-red-200">
                  <strong className="text-red-900 block mb-0.5">1. False Alarms During Rush Hours:</strong>
                  Cafeteria lunchtime cleaning or 8 AM morning shower peaks naturally exceed 15 L/min, triggering false emergency sirens.
                </div>
                <div className="p-2.5 rounded-lg bg-white border border-red-200">
                  <strong className="text-red-900 block mb-0.5">2. Undetected Night Leaks:</strong>
                  A 2.0 L/min flush tank leak or open tap running continuously all night stays below a 5 L/min threshold, wasting thousands of liters unnoticed.
                </div>
              </div>
            </Card>

            {/* AI Multi-Dimensional Learning */}
            <Card className="p-6 border-emerald-200 bg-emerald-50/20 space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#0B6B4F]" />
                <h4 className="text-sm font-bold text-emerald-950">Adaptive Multi-Dimensional AI Layer</h4>
              </div>

              <p className="text-xs text-gray-700 leading-relaxed">
                EcoCampus AI continuously correlates <strong>Flow &times; Duration &times; Time &times; Activity &times; Location</strong> to distinguish legitimate demand spikes from stealth waste.
              </p>

              <div className="space-y-2 text-xs text-gray-700">
                <div className="p-2.5 rounded-lg bg-white border border-emerald-200">
                  <strong className="text-emerald-900 block mb-0.5">Isolation Forest &amp; Gaussian Baselines:</strong>
                  Proposed unsupervised anomaly detection isolates abnormal feature combinations without requiring labeled training datasets.
                </div>
                <div className="p-2.5 rounded-lg bg-white border border-emerald-200">
                  <strong className="text-emerald-900 block mb-0.5">Explainable Triad Output:</strong>
                  Every alert returns a <strong>Risk Score (0-100)</strong>, exact <strong>Root Reason</strong>, and specific <strong>Prescriptive Recommendation</strong>.
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SECTION 5: SCALABILITY */}
      {/* ======================================================== */}
      {(activeTab === "scale" || activeTab === "architecture") && (
        <div className="space-y-6">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
            <span className="w-6 h-6 rounded-full bg-emerald-100 text-[#0B6B4F] font-bold text-xs flex items-center justify-center">
              5
            </span>
            <h3 className="text-lg font-bold text-gray-900">Campus-Wide Scalability Model</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-5 space-y-2">
              <div className="p-2 rounded-lg bg-emerald-50 text-[#0B6B4F] w-fit">
                <Cpu className="w-5 h-5" />
              </div>
              <h5 className="text-xs font-bold text-gray-900">Unique Hardware Identity</h5>
              <p className="text-xs text-gray-600 leading-relaxed">
                Every ESP32 has a unique cryptographic `deviceUid` (e.g. `DEV_ESP32_001`), ensuring isolated telemetry streams.
              </p>
            </Card>

            <Card className="p-5 space-y-2">
              <div className="p-2 rounded-lg bg-teal-50 text-teal-700 w-fit">
                <Database className="w-5 h-5" />
              </div>
              <h5 className="text-xs font-bold text-gray-900">Partitioned Ingestion</h5>
              <p className="text-xs text-gray-600 leading-relaxed">
                PostgreSQL schema partitions incoming telemetry device-wise and building-wise for sub-millisecond query performance.
              </p>
            </Card>

            <Card className="p-5 space-y-2">
              <div className="p-2 rounded-lg bg-blue-50 text-blue-700 w-fit">
                <Building2 className="w-5 h-5" />
              </div>
              <h5 className="text-xs font-bold text-gray-900">Zero Core Rework</h5>
              <p className="text-xs text-gray-600 leading-relaxed">
                10 or 100 additional blocks can be provisioned immediately without architectural modifications.
              </p>
            </Card>

            <Card className="p-5 space-y-2">
              <div className="p-2 rounded-lg bg-purple-50 text-purple-700 w-fit">
                <Layers className="w-5 h-5" />
              </div>
              <h5 className="text-xs font-bold text-gray-900">Cross-Block Analytics</h5>
              <p className="text-xs text-gray-600 leading-relaxed">
                The centralized portal compares per-block consumption, ranking facilities by efficiency and leak prevalence.
              </p>
            </Card>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SECTION 6: SECURITY AND RELIABILITY */}
      {/* ======================================================== */}
      {(activeTab === "security" || activeTab === "integrity") && (
        <div className="space-y-6">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
            <span className="w-6 h-6 rounded-full bg-emerald-100 text-[#0B6B4F] font-bold text-xs flex items-center justify-center">
              6
            </span>
            <h3 className="text-lg font-bold text-gray-900">Cybersecurity &amp; Operational Reliability</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                title: "Device Authentication",
                desc: "Every telemetry packet validated with pre-shared cryptographic API tokens.",
                icon: Lock,
              },
              {
                title: "Hardware UID Verification",
                desc: "Ingestion rejects unapproved or spoofed device identifiers at the gateway.",
                icon: Cpu,
              },
              {
                title: "Payload Validation",
                desc: "Strict schema bounds checking (e.g. flow rate 0-120 L/min, non-negative pulses).",
                icon: CheckCircle2,
              },
              {
                title: "In-Memory Rate Limiting",
                desc: "Burst protection blocks rapid spoofing attempts with HTTP 429 backoff.",
                icon: Activity,
              },
              {
                title: "Audit Event Logging",
                desc: "Security anomalies and rejected requests logged in session security buffer.",
                icon: Server,
              },
              {
                title: "Secure Credential Isolation",
                desc: "Wi-Fi and API keys stored in protected headers/NVS; never exposed in telemetry.",
                icon: ShieldCheck,
              },
              {
                title: "Wi-Fi Outage Resilience",
                desc: "Non-blocking Wi-Fi reconnect state machines with auto-reconnect retry loops.",
                icon: Wifi,
              },
              {
                title: "Zero Missed Pulses",
                desc: "Hardware interrupts continue counting water volume even when Wi-Fi is disconnected.",
                icon: Zap,
              },
            ].map((sec, idx) => {
              const Icon = sec.icon;
              return (
                <div key={idx} className="p-4 rounded-xl border border-gray-200 bg-white shadow-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-900">{sec.title}</span>
                    <Icon className="w-4 h-4 text-emerald-600" />
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">{sec.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SECTION 7: LIVE DATA VS SIMULATION */}
      {/* ======================================================== */}
      {(activeTab === "integrity" || activeTab === "scenarios") && (
        <div className="space-y-6">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
            <span className="w-6 h-6 rounded-full bg-emerald-100 text-[#0B6B4F] font-bold text-xs flex items-center justify-center">
              7
            </span>
            <h3 className="text-lg font-bold text-gray-900">Data Integrity: Live Telemetry vs Simulation</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-5 border-emerald-200 bg-emerald-50/30 space-y-2">
              <Badge variant="normal">Live Telemetry Stream</Badge>
              <h5 className="text-xs font-bold text-emerald-950 mt-2">Physical ESP32 &amp; Sensor</h5>
              <p className="text-xs text-gray-600 leading-relaxed">
                Streams real sensor pulses from physical hardware directly to `public.telemetry` on Supabase. Visible on the Water MVP page.
              </p>
            </Card>

            <Card className="p-5 border-blue-200 bg-blue-50/30 space-y-2">
              <Badge variant="info">Prototype Demonstration</Badge>
              <h5 className="text-xs font-bold text-blue-950 mt-2">End-to-End Validation</h5>
              <p className="text-xs text-gray-600 leading-relaxed">
                Demonstrates ingestion, latency, database persistence, and threshold rule triggering under active hardware conditions.
              </p>
            </Card>

            <Card className="p-5 border-amber-200 bg-amber-50/30 space-y-2">
              <Badge variant="warning">Simulated Scenarios</Badge>
              <h5 className="text-xs font-bold text-amber-950 mt-2">Explainability Sandbox</h5>
              <p className="text-xs text-gray-600 leading-relaxed">
                Contextual sandboxes (Scenarios A &amp; B) to demonstrate decision logic. Zero synthetic writes to production databases.
              </p>
            </Card>
          </div>

          {/* Mandatory Integrity Statement */}
          <div className="p-4 rounded-xl bg-gray-900 text-emerald-300 border border-emerald-800/50 flex items-start gap-3 text-xs leading-relaxed">
            <Info className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold uppercase tracking-wider text-emerald-400 block mb-0.5">
                Official Hackathon Data Integrity Statement
              </span>
              <p className="text-gray-200 font-mono text-[11px]">
                &quot;These scenarios are simulated to demonstrate the decision-making logic. Actual field data will be collected through ESP32 sensor nodes during deployment.&quot;
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SECTION 8: JUDGE QUESTIONS QUICK ACCESS (12 QUESTIONS) */}
      {/* ======================================================== */}
      {activeTab === "qa" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-gray-200">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-emerald-100 text-[#0B6B4F] font-bold text-xs flex items-center justify-center">
                  8
                </span>
                <h3 className="text-lg font-bold text-gray-900">Judge Questions Quick Access Panel</h3>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                12 concise, technically rigorous answers for offline hackathon jury evaluation.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 font-mono">
                Showing {filteredQAs.length} / {JUDGE_QUESTIONS.length} Questions
              </span>
            </div>
          </div>

          {/* Search and Category Filters */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search judge question or keyword..."
                className="w-full pl-9 pr-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-[#0B6B4F]"
              />
            </div>

            {/* Category Pill Filters */}
            <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto text-xs">
              {[
                { id: "all", label: "All (12)" },
                { id: "detection", label: "AI Detection" },
                { id: "architecture", label: "Architecture" },
                { id: "hardware", label: "Hardware" },
                { id: "security", label: "Security" },
                { id: "business", label: "Scale & Cost" },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                    selectedCategory === cat.id
                      ? "bg-[#0B6B4F] text-white font-semibold shadow-xs"
                      : "bg-gray-100 text-gray-600 hover:text-gray-900"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* QA Accordion List */}
          <div className="space-y-3">
            {filteredQAs.map((qa, index) => {
              const isExpanded = !!expandedQAs[qa.id];
              return (
                <div
                  key={qa.id}
                  className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-xs transition-all hover:border-gray-300"
                >
                  <button
                    onClick={() => toggleQA(qa.id)}
                    className="w-full px-5 py-4 text-left flex items-start justify-between gap-4 bg-white hover:bg-gray-50/80 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-lg bg-emerald-50 text-[#0B6B4F] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 border border-emerald-200">
                        Q{index + 1}
                      </span>
                      <div>
                        <h4 className="text-sm font-bold text-gray-900 leading-snug">
                          {qa.question}
                        </h4>
                        <span className="text-[10px] uppercase font-bold text-gray-400 mt-1 block">
                          Category: {qa.category}
                        </span>
                      </div>
                    </div>

                    <div className="p-1 rounded-lg text-gray-400 hover:text-gray-600 shrink-0">
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="px-5 pb-5 pt-2 border-t border-gray-100 space-y-3 bg-gray-50/40 text-xs">
                      <div className="p-3.5 rounded-xl bg-white border border-emerald-200 text-emerald-950 font-medium leading-relaxed">
                        <strong className="text-emerald-900 block mb-1">Executive Answer:</strong>
                        {qa.shortAnswer}
                      </div>

                      <div className="space-y-1.5">
                        <strong className="text-gray-800 text-[11px] uppercase tracking-wider block">
                          Technical Supporting Points for Presentation:
                        </strong>
                        <ul className="space-y-1.5 pl-1">
                          {qa.keyPoints.map((pt, pIdx) => (
                            <li key={pIdx} className="flex items-start gap-2 text-gray-700 leading-relaxed">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#0B6B4F] shrink-0 mt-1.5" />
                              <span>{pt}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </AppShell>
  );
}
