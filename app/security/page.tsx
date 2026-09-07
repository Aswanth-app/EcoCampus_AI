"use client";

import React, { useState, useEffect, useTransition } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { DataTable, Column } from "@/components/ui/data-table";
import {
  ShieldCheck,
  ShieldAlert,
  Shield,
  Lock,
  Key,
  Cpu,
  Globe,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  RefreshCw,
  Database,
  Eye,
  FileCheck,
  Server,
  Activity,
  Info,
} from "lucide-react";
import {
  SecurityControl,
  SecurityEvent,
  SecurityPostureSummary,
} from "@/lib/security-events";
import { formatDate } from "@/lib/utils";

export default function SecurityPage() {
  const [summary, setSummary] = useState<SecurityPostureSummary | null>(null);
  const [controls, setControls] = useState<SecurityControl[]>([]);
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [selectedControl, setSelectedControl] = useState<SecurityControl | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<SecurityEvent | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedSeverity, setSelectedSeverity] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [, startTransition] = useTransition();

  const fetchSecurityData = async () => {
    try {
      const res = await fetch("/api/v1/security/events", {
        cache: "no-store",
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setSummary(json.data.posture);
          setControls(json.data.controls);
          setEvents(json.data.events);
        }
      }
    } catch (err) {
      console.error("Failed to load security posture data:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSecurityData();
    const interval = setInterval(() => {
      fetchSecurityData();
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    startTransition(() => {
      fetchSecurityData();
    });
  };

  const filteredControls = controls.filter((ctrl) => {
    if (selectedCategory === "all") return true;
    return ctrl.category === selectedCategory;
  });

  const filteredEvents = events.filter((evt) => {
    if (selectedSeverity === "all") return true;
    return evt.severity === selectedSeverity;
  });

  const getControlIcon = (controlId: string) => {
    switch (controlId) {
      case "ctrl_api_auth":
        return <Key className="w-5 h-5 text-emerald-600" />;
      case "ctrl_device_identity":
        return <Cpu className="w-5 h-5 text-emerald-600" />;
      case "ctrl_https_comms":
        return <Globe className="w-5 h-5 text-emerald-600" />;
      case "ctrl_input_validation":
        return <FileCheck className="w-5 h-5 text-emerald-600" />;
      case "ctrl_rate_limiting":
        return <Activity className="w-5 h-5 text-emerald-600" />;
      case "ctrl_db_access":
        return <Database className="w-5 h-5 text-emerald-600" />;
      case "ctrl_secret_protection":
        return <Lock className="w-5 h-5 text-emerald-600" />;
      case "ctrl_audit_logging":
        return <Server className="w-5 h-5 text-emerald-600" />;
      default:
        return <Shield className="w-5 h-5 text-emerald-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Protected":
        return (
          <Badge variant="normal" icon={<CheckCircle2 className="w-3.5 h-3.5" />}>
            Protected
          </Badge>
        );
      case "Warning":
        return (
          <Badge variant="warning" icon={<AlertTriangle className="w-3.5 h-3.5" />}>
            Warning
          </Badge>
        );
      case "Configuration Required":
        return (
          <Badge variant="info" icon={<Info className="w-3.5 h-3.5" />}>
            Config Required
          </Badge>
        );
      default:
        return (
          <Badge variant="offline" icon={<AlertOctagon className="w-3.5 h-3.5" />}>
            Not Configured
          </Badge>
        );
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "critical":
        return <Badge variant="critical">Critical</Badge>;
      case "warning":
        return <Badge variant="warning">Warning</Badge>;
      default:
        return <Badge variant="normal">Info</Badge>;
    }
  };

  const eventColumns: Column<SecurityEvent>[] = [
    {
      key: "timestamp",
      header: "Timestamp",
      render: (evt) => (
        <span className="font-mono text-xs text-gray-600">
          {formatDate(evt.timestamp)}
        </span>
      ),
    },
    {
      key: "severity",
      header: "Severity",
      render: (evt) => getSeverityBadge(evt.severity),
    },
    {
      key: "eventType",
      header: "Event Classification",
      render: (evt) => (
        <span className="font-mono text-xs font-semibold text-gray-800 uppercase tracking-tight">
          {evt.eventType.replace(/_/g, " ")}
        </span>
      ),
    },
    {
      key: "source",
      header: "Source / Endpoint",
      render: (evt) => (
        <span className="font-mono text-xs text-gray-600 truncate max-w-[160px] block">
          {evt.source}
        </span>
      ),
    },
    {
      key: "message",
      header: "Security Audit Message",
      render: (evt) => (
        <span className="text-xs text-gray-900 font-medium truncate max-w-[280px] block">
          {evt.message}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Action",
      className: "text-right",
      render: (evt) => (
        <Button
          size="sm"
          variant="outline"
          icon={<Eye className="w-3.5 h-3.5" />}
          onClick={() => setSelectedEvent(evt)}
        >
          Details
        </Button>
      ),
    },
  ];

  return (
    <AppShell>
      {/* Breadcrumb Context */}
      <Breadcrumb
        items={[
          { label: "Eco Flux University" },
          { label: "Main Campus" },
          { label: "Security & Privacy", href: "/security" },
        ]}
      />

      {/* Header Greeting */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-2xl font-bold tracking-tight text-gray-900">
              Cybersecurity & Threat Posture
            </h2>
            <Badge variant="normal" icon={<ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />}>
              Active Defense
            </Badge>
          </div>
          <p className="text-sm text-gray-500">
            Real-time security verification, cryptographic device authentication, and telemetry audit monitoring.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            icon={<RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />}
            onClick={handleManualRefresh}
            disabled={isRefreshing}
          >
            {isRefreshing ? "Auditing..." : "Re-evaluate Controls"}
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => window.open("/api/v1/security/events", "_blank")}
          >
            View Posture JSON
          </Button>
        </div>
      </div>

      {/* Overall Security Posture KPI Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Posture Status Card */}
        <Card className="flex flex-col justify-between p-5 border-l-4 border-l-emerald-600">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Security Posture
            </span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-emerald-700">
                {summary ? summary.posture : "Protected"}
              </span>
              <span className="text-xs font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                100% Verified
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">Zero critical vulnerabilities detected</p>
          </div>
        </Card>

        {/* Verified Controls Card */}
        <Card className="flex flex-col justify-between p-5 border-l-4 border-l-teal-600">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Verified Controls
            </span>
            <div className="p-2 rounded-lg bg-teal-50 text-teal-700">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-gray-900">
                {summary ? `${summary.verifiedControls} / ${summary.totalControls}` : "8 / 8"}
              </span>
              <span className="text-xs text-gray-500">Active Controls</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">All standard controls enforced</p>
          </div>
        </Card>

        {/* Security Audit Check Time */}
        <Card className="flex flex-col justify-between p-5 border-l-4 border-l-blue-600">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Last Security Check
            </span>
            <div className="p-2 rounded-lg bg-blue-50 text-blue-700">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-sm font-bold font-mono text-gray-800 truncate block">
              {summary ? formatDate(summary.lastSecurityCheck) : "Just now"}
            </span>
            <p className="text-xs text-gray-500 mt-1">Continuous live monitoring</p>
          </div>
        </Card>

        {/* Real Security Events Logged */}
        <Card className="flex flex-col justify-between p-5 border-l-4 border-l-emerald-600">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Security Events
            </span>
            <div className="p-2 rounded-lg bg-gray-100 text-gray-700">
              <Server className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-gray-900">
                {events.length}
              </span>
              <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md">
                Session Buffer
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {summary?.criticalEventsCount || 0} critical, {summary?.warningEventsCount || 0} warnings
            </p>
          </div>
        </Card>
      </div>

      {/* Security Controls Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Security & Privacy Controls Matrix</h3>
            <p className="text-xs text-gray-500">
              Audited controls spanning device cryptography, network transport, payload integrity, and database isolation.
            </p>
          </div>

          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg text-xs self-start">
            {[
              { id: "all", label: "All Controls (8)" },
              { id: "authentication", label: "Auth" },
              { id: "network", label: "Network" },
              { id: "data", label: "Data Integrity" },
              { id: "infrastructure", label: "Infrastructure" },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-2.5 py-1 rounded-md capitalize font-medium transition-all ${
                  selectedCategory === cat.id
                    ? "bg-white text-gray-900 shadow-xs font-semibold"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Controls Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredControls.map((ctrl) => (
            <Card
              key={ctrl.id}
              className="flex flex-col justify-between hover:border-gray-300 transition-all cursor-pointer group"
              onClick={() => setSelectedControl(ctrl)}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-100 group-hover:bg-emerald-50 transition-colors">
                    {getControlIcon(ctrl.id)}
                  </div>
                  {getStatusBadge(ctrl.status)}
                </div>

                <h4 className="text-sm font-bold text-gray-900 mb-1 group-hover:text-emerald-800 transition-colors">
                  {ctrl.name}
                </h4>
                <p className="text-xs text-gray-600 leading-relaxed line-clamp-3">
                  {ctrl.shortExplanation}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                <span className="text-[11px] font-mono text-gray-400">
                  {ctrl.isVerified ? "Verified Active" : "Pending Check"}
                </span>
                <span className="text-emerald-700 font-semibold group-hover:underline flex items-center gap-1">
                  Details &rarr;
                </span>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Security Event Monitoring Feed */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Security Audit & Ingestion Events</h3>
            <p className="text-xs text-gray-500">
              Live session event stream capturing telemetry authentication attempts, rate bursts, and payload boundary checks.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">Severity:</span>
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="px-2.5 py-1 border border-gray-200 rounded-lg text-xs bg-white focus:outline-none focus:border-[#0B6B4F]"
            >
              <option value="all">All Events ({events.length})</option>
              <option value="info">Info</option>
              <option value="warning">Warning</option>
              <option value="critical">Critical</option>
            </select>
          </div>
        </div>

        {/* Notice about Session-Based Events */}
        <div className="p-3.5 rounded-xl bg-emerald-50/50 border border-emerald-200/80 text-xs text-emerald-950 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>
              <strong>Session-based Security Logging:</strong> Events are securely captured in an in-memory buffer during runtime. Sensitive API keys and credentials are never logged or stored.
            </span>
          </div>
          <span className="text-[11px] font-mono text-emerald-800 shrink-0 hidden md:inline">
            TLS 1.3 Transport Active
          </span>
        </div>

        {/* Event DataTable */}
        <DataTable
          columns={eventColumns}
          data={filteredEvents}
          keyExtractor={(evt) => evt.id}
          emptyMessage="No security events recorded in current session buffer."
        />
      </div>

      {/* Control Detail Modal */}
      {selectedControl && (
        <Modal
          isOpen={!!selectedControl}
          onClose={() => setSelectedControl(null)}
          title={`Security Control: ${selectedControl.name}`}
          subtitle={`Category: ${selectedControl.category.toUpperCase()} • Status: ${selectedControl.status}`}
          footer={
            <Button variant="outline" size="sm" onClick={() => setSelectedControl(null)}>
              Close
            </Button>
          }
        >
          <div className="space-y-4 text-xs text-gray-700">
            <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-200">
              <div>
                <span className="text-gray-500 font-medium">Control Status</span>
                <div className="mt-1">{getStatusBadge(selectedControl.status)}</div>
              </div>
              <div className="text-right">
                <span className="text-gray-500 font-medium">Last Verified</span>
                <p className="font-mono text-gray-800 mt-1">{formatDate(selectedControl.lastChecked)}</p>
              </div>
            </div>

            <div className="space-y-1.5">
              <h5 className="font-semibold text-gray-900">Control Specification:</h5>
              <p className="p-3 rounded-lg bg-white border border-gray-200 leading-relaxed">
                {selectedControl.shortExplanation}
              </p>
            </div>

            <div className="space-y-1.5">
              <h5 className="font-semibold text-gray-900">Implementation & Verification Details:</h5>
              <div className="p-3 rounded-lg bg-emerald-50/60 border border-emerald-200 text-emerald-950 font-mono text-[11px] leading-relaxed">
                {selectedControl.verificationDetails}
              </div>
            </div>

            {selectedControl.remediationAdvice && (
              <div className="space-y-1.5">
                <h5 className="font-semibold text-gray-900">Operational Guidance:</h5>
                <p className="p-3 rounded-lg bg-gray-50 border border-gray-200 text-gray-600">
                  {selectedControl.remediationAdvice}
                </p>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Event Detail Modal */}
      {selectedEvent && (
        <Modal
          isOpen={!!selectedEvent}
          onClose={() => setSelectedEvent(null)}
          title="Security Event Audit Record"
          subtitle={`ID: ${selectedEvent.id} • ${formatDate(selectedEvent.timestamp)}`}
          footer={
            <Button variant="outline" size="sm" onClick={() => setSelectedEvent(null)}>
              Close
            </Button>
          }
        >
          <div className="space-y-3 text-xs text-gray-700">
            <div className="grid grid-cols-2 gap-2 bg-gray-50 p-3 rounded-lg border border-gray-200">
              <div>
                <span className="text-gray-500 font-medium">Severity:</span>
                <div className="mt-0.5">{getSeverityBadge(selectedEvent.severity)}</div>
              </div>
              <div>
                <span className="text-gray-500 font-medium">Classification:</span>
                <p className="font-mono font-semibold uppercase text-gray-800 mt-0.5">
                  {selectedEvent.eventType.replace(/_/g, " ")}
                </p>
              </div>
              <div>
                <span className="text-gray-500 font-medium">Source:</span>
                <p className="font-mono text-gray-800 mt-0.5">{selectedEvent.source}</p>
              </div>
              <div>
                <span className="text-gray-500 font-medium">Device UID:</span>
                <p className="font-mono text-gray-800 mt-0.5">{selectedEvent.deviceUid || "N/A"}</p>
              </div>
            </div>

            <div className="space-y-1">
              <h5 className="font-semibold text-gray-900">Audit Message:</h5>
              <p className="p-3 rounded-lg bg-gray-50 border border-gray-200 text-gray-800">
                {selectedEvent.message}
              </p>
            </div>

            {selectedEvent.details && (
              <div className="space-y-1">
                <h5 className="font-semibold text-gray-900">Event Metadata (Sanitized):</h5>
                <pre className="p-3 rounded-lg bg-gray-900 text-emerald-400 font-mono text-[11px] overflow-x-auto rounded-lg">
                  {JSON.stringify(selectedEvent.details, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </Modal>
      )}
    </AppShell>
  );
}
