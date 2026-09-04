"use client";

import React, { useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { AlertRow } from "@/components/ui/alert-row";
import { KpiCard } from "@/components/ui/kpi-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { MOCK_ALERTS } from "@/data/mock-data";
import { Alert, AlertStatus } from "@/types";
import { useWaterAi } from "@/lib/use-water-ai";
import { AlertTriangle, AlertOctagon, Info, CheckCircle2, ShieldAlert, Radio } from "lucide-react";
import { formatFlowRate } from "@/lib/utils";

export default function AlertsPage() {
  const { liveAlerts, isOnline, riskLevel } = useWaterAi(6000);
  const [activeTab, setActiveTab] = useState<"live" | "archive">("live");
  const [historicalAlerts, setHistoricalAlerts] = useState<Alert[]>(
    MOCK_ALERTS.map((a) => ({ ...a, isHistoricalDemo: true }))
  );
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);

  const displayedAlerts = activeTab === "live"
    ? liveAlerts
    : historicalAlerts.filter((a) => {
        if (filterStatus === "all") return true;
        return a.status === filterStatus;
      });

  const handleUpdateStatus = (alertId: string, newStatus: AlertStatus) => {
    setHistoricalAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, status: newStatus } : a))
    );
    setSelectedAlert(null);
  };

  return (
    <AppShell>
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: "Eco Flux University" },
          { label: "Main Campus" },
          { label: "Alert Center", href: "/alerts" },
        ]}
      />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-2xl font-bold tracking-tight text-gray-900">Alert Center & Operational Response</h2>
            {isOnline ? (
              <Badge variant="normal" icon={<Radio className="w-3.5 h-3.5 animate-pulse text-emerald-600" />}>
                Live Anomaly Engine Active
              </Badge>
            ) : (
              <Badge variant="neutral">
                Engine Standby
              </Badge>
            )}
          </div>
          <p className="text-sm text-gray-500">
            Real-time anomaly evaluation on active ESP32 telemetry stream and historical incident audit log.
          </p>
        </div>
      </div>

      {/* Mode Selector Tabs */}
      <div className="flex items-center gap-3 border-b border-gray-200 pb-3">
        <button
          onClick={() => setActiveTab("live")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === "live"
              ? "bg-[#0B6B4F] text-white shadow-xs"
              : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${isOnline ? "bg-emerald-300 animate-ping" : "bg-gray-400"}`} />
          Active Live Anomalies ({liveAlerts.length})
        </button>
        <button
          onClick={() => setActiveTab("archive")}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === "archive"
              ? "bg-[#0B6B4F] text-white shadow-xs"
              : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
          }`}
        >
          Historical Archive (Demo Data) ({historicalAlerts.length})
        </button>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard
          title="Active Live Anomalies"
          value={liveAlerts.length}
          unit="Current"
          badge={
            liveAlerts.length > 0 ? (
              <Badge variant="critical">Immediate Action</Badge>
            ) : (
              <Badge variant="normal">Normal Stream</Badge>
            )
          }
          icon={<AlertOctagon className="w-5 h-5 text-red-600" />}
          supportingText={isOnline ? "Real-time AI Rule Evaluation" : "Node in Standby"}
        />

        <KpiCard
          title="Current AI Risk Score"
          value={riskLevel}
          unit="Level"
          badge={<Badge variant={riskLevel === "CRITICAL" ? "critical" : riskLevel === "HIGH" ? "warning" : "normal"}>Composite</Badge>}
          icon={<AlertTriangle className="w-5 h-5 text-[#0B6B4F]" />}
          supportingText="Multi-factor Gaussian Scorer"
        />

        <KpiCard
          title="Archived Incidents (Demo)"
          value={historicalAlerts.length}
          unit="Records"
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
          supportingText="Preserved for Reporting Audits"
        />
      </div>

      {/* Filter Tabs for Archive Mode */}
      {activeTab === "archive" && (
        <div className="flex items-center gap-2">
          {(["all", "pending", "investigating", "resolved"] as const).map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                filterStatus === st
                  ? "bg-[#0B6B4F] text-white shadow-xs"
                  : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              {st === "all" ? `All Archive (${historicalAlerts.length})` : st}
            </button>
          ))}
        </div>
      )}

      {/* Alert Rows List */}
      <div className="space-y-3">
        {displayedAlerts.length > 0 ? (
          displayedAlerts.map((alert) => (
            <AlertRow key={alert.id} alert={alert} onViewDetails={(a) => setSelectedAlert(a)} />
          ))
        ) : (
          <div className="p-8 rounded-2xl border border-dashed border-gray-200 bg-white text-center text-xs text-gray-500">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
            <p className="font-semibold text-gray-800 text-sm">No Active Live Water Anomalies</p>
            <p className="mt-1 text-gray-400">
              The live telemetry stream from physical node is operating within baseline parameters without threshold breaches.
            </p>
          </div>
        )}
      </div>

      {/* Alert Detail & Investigation Modal */}
      {selectedAlert && (
        <Modal
          isOpen={!!selectedAlert}
          onClose={() => setSelectedAlert(null)}
          title={`Incident Audit: ${selectedAlert.title}`}
          subtitle={`Event ID: ${selectedAlert.anomalyEventId} • ${selectedAlert.buildingName}`}
          footer={
            <div className="flex items-center justify-between w-full">
              <div className="text-xs text-gray-500">
                Current Status: <strong className="capitalize text-gray-900">{selectedAlert.status}</strong>
              </div>
              <div className="flex items-center gap-2">
                {selectedAlert.status === "pending" && (
                  <Button variant="secondary" size="sm" onClick={() => handleUpdateStatus(selectedAlert.id, "investigating")}>
                    Mark Investigating
                  </Button>
                )}
                {selectedAlert.status !== "resolved" && (
                  <Button variant="primary" size="sm" onClick={() => handleUpdateStatus(selectedAlert.id, "resolved")}>
                    Resolve & Retain History
                  </Button>
                )}
              </div>
            </div>
          }
        >
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Alert Type:</span>
                <span className="font-mono font-semibold text-gray-900">{selectedAlert.alertType}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Affected Building & Location:</span>
                <span className="font-medium text-gray-900">{selectedAlert.buildingName} ({selectedAlert.locationName})</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Device UID / Sensor:</span>
                <span className="font-mono text-gray-800">{selectedAlert.deviceUid} ({selectedAlert.sensorId})</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Current Sensor Reading:</span>
                <strong className="text-red-700 font-mono text-sm">{formatFlowRate(selectedAlert.currentFlowLpm)}</strong>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Detection Window Duration:</span>
                <span className="font-semibold text-gray-900">{selectedAlert.durationMinutes} minutes continuous</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-emerald-50/80 border border-emerald-200 space-y-1.5">
              <h5 className="font-bold text-[#0B6B4F] text-xs uppercase tracking-wider">Actionable Recommendation</h5>
              <p className="font-semibold text-gray-900">{selectedAlert.recommendationTitle}</p>
              <p className="text-gray-700">{selectedAlert.recommendationDescription}</p>
            </div>
          </div>
        </Modal>
      )}
    </AppShell>
  );
}

