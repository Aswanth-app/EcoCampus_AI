"use client";

import React, { useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { DataTable, Column } from "@/components/ui/data-table";
import { StatusIndicator } from "@/components/ui/status-indicator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { LiveTelemetryCard } from "@/components/ui/live-telemetry-card";
import { useTelemetry } from "@/lib/use-telemetry";
import { MOCK_DEVICES, MOCK_LOCATIONS } from "@/data/mock-data";
import { Device } from "@/types";
import { formatDate } from "@/lib/utils";
import { Cpu, Plus, Wifi, WifiOff, RefreshCw, Settings, CheckCircle2, Radio, Activity } from "lucide-react";

export default function DevicesPage() {
  const [showAddDeviceModal, setShowAddDeviceModal] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3 | 4>(1);

  // Form states for wizard
  const [deviceUid, setDeviceUid] = useState("DEV_ESP32_009");
  const [sensorType, setSensorType] = useState("YF-S201");
  const [resourceType, setResourceType] = useState("water");
  const [assignedLocationId, setAssignedLocationId] = useState(MOCK_LOCATIONS[0].id);

  // Live telemetry feed
  const { data: telemetryData, metrics, isLoading, isLiveReceiving, refetch } = useTelemetry(4000);

  // Merge real ESP32 device from Supabase with device list
  const realDevice = telemetryData?.device;
  const registeredDevices: Device[] = realDevice
    ? [
        {
          id: realDevice.id,
          deviceUid: realDevice.device_uid,
          locationId: realDevice.location_id || MOCK_LOCATIONS[0].id,
          locationName: "Main Flow Inflow Manifold",
          buildingName: "Hostel Block A",
          campusName: "Main Campus",
          deviceType: "ESP32",
          status: metrics.isOnline ? "online" : "offline",
          firmwareVersion: realDevice.firmware_version || "v2.4.1",
          lastSeenAt: realDevice.last_seen_at || metrics.latestTimestamp || new Date().toISOString(),
          sensorsCount: 1,
          registeredAt: realDevice.created_at || "2026-08-25T13:54:46Z",
        },
        ...MOCK_DEVICES.filter((d) => d.deviceUid !== "DEV_ESP32_001"),
      ]
    : MOCK_DEVICES;

  const onlineCount = registeredDevices.filter((d) => d.status === "online").length;
  const offlineCount = registeredDevices.length - onlineCount;

  const columns: Column<Device>[] = [
    {
      key: "deviceUid",
      header: "Device UID",
      render: (dev) => (
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-md ${dev.deviceUid === "DEV_ESP32_001" ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-700"}`}>
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-mono font-semibold text-gray-900">{dev.deviceUid}</span>
              {dev.deviceUid === "DEV_ESP32_001" && (
                <span className="text-[9px] px-1.5 py-0.2 rounded-sm bg-emerald-100 text-emerald-800 font-bold border border-emerald-300">
                  PHYSICAL NODE
                </span>
              )}
            </div>
            <p className="text-[11px] text-gray-500">{dev.deviceType} ({dev.firmwareVersion})</p>
          </div>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (dev) => (
        <div className="flex items-center gap-1.5">
          <StatusIndicator status={dev.status} size="sm" />
          {dev.deviceUid === "DEV_ESP32_001" && metrics.isOnline && (
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
          )}
        </div>
      ),
    },
    {
      key: "resourceType",
      header: "Resource & Sensor",
      render: (dev) => (
        <div>
          <Badge variant="normal">Water ({dev.deviceUid === "DEV_ESP32_001" ? metrics.sensorType : "YF-S201"})</Badge>
          {dev.deviceUid === "DEV_ESP32_001" && metrics.totalVolumeLiters > 0 && (
            <p className="text-[10px] font-mono text-emerald-700 mt-0.5">
              {metrics.totalVolumeLiters.toFixed(2)} L ({metrics.pulseCount} pulses)
            </p>
          )}
        </div>
      ),
    },
    {
      key: "location",
      header: "Assigned Location",
      render: (dev) => (
        <div className="text-xs">
          <span className="font-semibold text-gray-900">{dev.buildingName}</span>
          <p className="text-gray-500">{dev.locationName}</p>
        </div>
      ),
    },
    {
      key: "lastSeenAt",
      header: "Last Telemetry",
      render: (dev) => (
        <span className="text-xs font-mono text-gray-600">
          {dev.deviceUid === "DEV_ESP32_001" && metrics.lastSeenAt
            ? formatDate(metrics.lastSeenAt)
            : formatDate(dev.lastSeenAt)}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      className: "text-right",
      render: (dev) => (
        <Button size="sm" variant="outline" icon={<Settings className="w-3.5 h-3.5" />} onClick={() => setSelectedDevice(dev)}>
          Manage
        </Button>
      ),
    },
  ];

  return (
    <AppShell>
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: "Eco Flux University" },
          { label: "Main Campus" },
          { label: "Hardware Nodes", href: "/devices" },
        ]}
      />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-2xl font-bold tracking-tight text-gray-900">IoT Device & Sensor Management</h2>
            <Badge variant="neutral" icon={<Cpu className="w-3.5 h-3.5" />}>Hardware Nodes</Badge>
          </div>
          <p className="text-sm text-gray-500">
            Register and monitor physical ESP32 microcontrollers and YF-S201 pulse flow sensors.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="primary" size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => { setWizardStep(1); setShowAddDeviceModal(true); }}>
            Register New Device
          </Button>
        </div>
      </div>

      {/* Live ESP32 Hardware Card */}
      <LiveTelemetryCard
        deviceUid={metrics.deviceUid}
        sensorType={metrics.sensorType}
        flowRateLpm={metrics.flowRateLpm}
        totalVolumeLiters={metrics.totalVolumeLiters}
        pulseCount={metrics.pulseCount}
        recordId={metrics.recordId}
        timestamp={metrics.latestTimestamp}
        lastSeenAt={metrics.lastSeenAt}
        isOnline={metrics.isOnline}
        isLiveReceiving={isLiveReceiving}
        isLoading={isLoading}
        onRefresh={refetch}
      />

      {/* Device Overview Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Registered Devices ({registeredDevices.length})</h3>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span className="flex items-center gap-1"><Wifi className="w-3.5 h-3.5 text-emerald-600" /> {onlineCount} Online</span>
            <span className="flex items-center gap-1"><WifiOff className="w-3.5 h-3.5 text-gray-400" /> {offlineCount} Offline</span>
          </div>
        </div>

        <DataTable columns={columns} data={registeredDevices} keyExtractor={(dev) => dev.id} />
      </div>

      {/* Guided Add Device Workflow Modal */}
      <Modal
        isOpen={showAddDeviceModal}
        onClose={() => setShowAddDeviceModal(false)}
        title="Register New IoT Hardware Node"
        subtitle={`Step ${wizardStep} of 4: Guided Device Onboarding`}
        footer={
          <div className="flex items-center justify-between w-full">
            <Button variant="ghost" size="sm" disabled={wizardStep === 1} onClick={() => setWizardStep((prev) => (prev - 1) as any)}>
              Back
            </Button>
            <div className="flex items-center gap-2">
              {wizardStep < 4 ? (
                <Button variant="primary" size="sm" onClick={() => setWizardStep((prev) => (prev + 1) as any)}>
                  Continue $\rightarrow$
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    alert(`Device ${deviceUid} successfully registered and configured!`);
                    setShowAddDeviceModal(false);
                  }}
                >
                  Confirm & Provision
                </Button>
              )}
            </div>
          </div>
        }
      >
        <div className="space-y-4 text-xs text-gray-700">
          {wizardStep === 1 && (
            <div className="space-y-3">
              <label className="block font-semibold text-gray-900">1. Microcontroller Hardware Model</label>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg border-2 border-[#0B6B4F] bg-emerald-50/50 cursor-pointer">
                  <div className="font-bold text-gray-900">ESP32 DevKit V1</div>
                  <p className="text-gray-500 text-[11px] mt-0.5">Wi-Fi + BLE, Dual Core 240MHz, 3.3V GPIO</p>
                </div>
                <div className="p-3 rounded-lg border border-gray-200 hover:border-gray-300 opacity-60 cursor-not-allowed">
                  <div className="font-bold text-gray-900">ESP8266 NodeMCU</div>
                  <p className="text-gray-500 text-[11px] mt-0.5">Wi-Fi, Single Core 80MHz (Legacy)</p>
                </div>
              </div>
              <div className="mt-2">
                <label className="block text-gray-700 mb-1">Device UID Identifier</label>
                <input
                  type="text"
                  value={deviceUid}
                  onChange={(e) => setDeviceUid(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg font-mono text-xs focus:outline-none focus:border-[#0B6B4F]"
                />
              </div>
            </div>
          )}

          {wizardStep === 2 && (
            <div className="space-y-3">
              <label className="block font-semibold text-gray-900">2. Transducer Sensor Selection</label>
              <div className="grid grid-cols-1 gap-2">
                <div className="p-3 rounded-lg border-2 border-[#0B6B4F] bg-emerald-50/50">
                  <div className="font-bold text-gray-900">YF-S201 Water Flow Sensor (Hall Effect)</div>
                  <p className="text-gray-500 text-[11px]">Pulse rate: 7.5 Hz per L/min (450 pulses/L), 1-30 L/min working range</p>
                </div>
              </div>
            </div>
          )}

          {wizardStep === 3 && (
            <div className="space-y-3">
              <label className="block font-semibold text-gray-900">3. Physical Location Assignment</label>
              <select
                value={assignedLocationId}
                onChange={(e) => setAssignedLocationId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs bg-white focus:outline-none focus:border-[#0B6B4F]"
              >
                {MOCK_LOCATIONS.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.buildingName} — {loc.name} ({loc.floor})
                  </option>
                ))}
              </select>
            </div>
          )}

          {wizardStep === 4 && (
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Ready to Provision Device</p>
                  <p className="text-[11px] text-emerald-800">
                    Device <strong>{deviceUid}</strong> configured with {sensorType} sensor.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Device Detail Modal */}
      {selectedDevice && (
        <Modal
          isOpen={!!selectedDevice}
          onClose={() => setSelectedDevice(null)}
          title={`Device Details: ${selectedDevice.deviceUid}`}
          subtitle={`Type: ${selectedDevice.deviceType} • Firmware: ${selectedDevice.firmwareVersion}`}
          footer={
            <Button variant="outline" size="sm" onClick={() => setSelectedDevice(null)}>
              Close
            </Button>
          }
        >
          <div className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-2 bg-gray-50 p-3 rounded-lg border border-gray-200">
              <div>
                <span className="text-gray-500">Hardware Model:</span>
                <p className="font-semibold text-gray-800">{selectedDevice.deviceType}</p>
              </div>
              <div>
                <span className="text-gray-500">Operating Status:</span>
                <p className="font-semibold capitalize text-gray-800">{selectedDevice.status}</p>
              </div>
              <div>
                <span className="text-gray-500">Assigned Building:</span>
                <p className="font-semibold text-gray-800">{selectedDevice.buildingName}</p>
              </div>
              <div>
                <span className="text-gray-500">Location:</span>
                <p className="font-semibold text-gray-800">{selectedDevice.locationName}</p>
              </div>
              <div>
                <span className="text-gray-500">Last Telemetry:</span>
                <p className="font-mono text-gray-800">{formatDate(selectedDevice.lastSeenAt)}</p>
              </div>
              <div>
                <span className="text-gray-500">Registered On:</span>
                <p className="font-mono text-gray-800">{formatDate(selectedDevice.registeredAt)}</p>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </AppShell>
  );
}
