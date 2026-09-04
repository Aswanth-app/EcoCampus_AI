"use client";

import React, { useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { StatusIndicator } from "@/components/ui/status-indicator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MOCK_LOCATIONS, MOCK_BUILDINGS, MOCK_CAMPUSES } from "@/data/mock-data";
import { formatVolume, formatFlowRate } from "@/lib/utils";
import { MapPin, Building2, Cpu, Plus, Layers, ArrowRight } from "lucide-react";
import { Modal } from "@/components/ui/modal";

export default function LocationsPage() {
  const [selectedBuildingId, setSelectedBuildingId] = useState<string>("all");
  const [showAddLocationModal, setShowAddLocationModal] = useState(false);

  const filteredLocations = selectedBuildingId === "all"
    ? MOCK_LOCATIONS
    : MOCK_LOCATIONS.filter((loc) => loc.buildingId === selectedBuildingId);

  return (
    <AppShell>
      {/* Breadcrumb Context */}
      <Breadcrumb
        items={[
          { label: "Eco Flux University" },
          { label: "Main Campus" },
          { label: "Locations Matrix", href: "/locations" },
        ]}
      />

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-2xl font-bold tracking-tight text-gray-900">Campus Locations Management</h2>
            <Badge variant="neutral" icon={<Layers className="w-3.5 h-3.5" />}>Hierarchy Level: Location</Badge>
          </div>
          <p className="text-sm text-gray-500">
            Structure monitored zones (Restrooms, Pipeline Zones, Utility Areas, Tank Entrances) across campuses and buildings.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="primary" size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => setShowAddLocationModal(true)}>
            Add Monitored Location
          </Button>
        </div>
      </div>

      {/* Hierarchy Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setSelectedBuildingId("all")}
          className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
            selectedBuildingId === "all"
              ? "bg-[#0B6B4F] text-white border-[#0B6B4F] shadow-xs"
              : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
          }`}
        >
          All Monitored Locations ({MOCK_LOCATIONS.length})
        </button>

        {MOCK_BUILDINGS.map((bld) => (
          <button
            key={bld.id}
            onClick={() => setSelectedBuildingId(bld.id)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
              selectedBuildingId === bld.id
                ? "bg-[#0B6B4F] text-white border-[#0B6B4F] shadow-xs"
                : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
            }`}
          >
            {bld.name} ({MOCK_LOCATIONS.filter((l) => l.buildingId === bld.id).length})
          </button>
        ))}
      </div>

      {/* Location Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredLocations.map((location) => (
          <div
            key={location.id}
            className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs hover:shadow-md hover:border-gray-300 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-emerald-50 text-[#0B6B4F]">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-base font-semibold text-gray-900">{location.name}</h4>
                    <span className="text-xs text-gray-500 font-medium">{location.buildingName} • {location.floor}</span>
                  </div>
                </div>
                <StatusIndicator status={location.status} size="sm" />
              </div>

              <div className="grid grid-cols-2 gap-3 my-4 p-3 rounded-lg bg-gray-50/80 border border-gray-100 text-xs">
                <div>
                  <span className="text-gray-500 block">Today's Volume</span>
                  <span className="font-semibold text-gray-900 text-sm">{formatVolume(location.waterUsageTodayLiters)}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">Current Flow</span>
                  <span className="font-semibold text-gray-900 text-sm">{formatFlowRate(location.currentFlowLpm)}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-gray-100 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <Cpu className="w-3.5 h-3.5 text-gray-400" />
                {location.devicesCount} Device Attached
              </span>
              <Button size="sm" variant="ghost" icon={<ArrowRight className="w-3.5 h-3.5" />} onClick={() => (window.location.href = "/devices")}>
                View Devices
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Location Modal */}
      <Modal
        isOpen={showAddLocationModal}
        onClose={() => setShowAddLocationModal(false)}
        title="Add Monitored Location"
        subtitle="Hierarchy: Organization → Campus → Building → Location"
        footer={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowAddLocationModal(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                alert("Location placeholder created. Backend persistence will be added in Phase 2.");
                setShowAddLocationModal(false);
              }}
            >
              Save Location
            </Button>
          </div>
        }
      >
        <form className="space-y-4 text-xs">
          <div>
            <label className="block font-medium text-gray-700 mb-1">Building Context</label>
            <select className="w-full rounded-lg border border-gray-300 p-2 text-sm">
              {MOCK_BUILDINGS.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.campusName})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-medium text-gray-700 mb-1">Location Name</label>
            <input
              type="text"
              placeholder="e.g. 2nd Floor East Restroom"
              className="w-full rounded-lg border border-gray-300 p-2 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-gray-700 mb-1">Floor Level</label>
              <input
                type="text"
                placeholder="e.g. 2nd Floor"
                className="w-full rounded-lg border border-gray-300 p-2 text-sm"
              />
            </div>
            <div>
              <label className="block font-medium text-gray-700 mb-1">Location Type</label>
              <select className="w-full rounded-lg border border-gray-300 p-2 text-sm">
                <option value="restroom">Restroom</option>
                <option value="pipeline_zone">Pipeline Zone</option>
                <option value="utility_area">Utility Area</option>
                <option value="tank_area">Tank Area</option>
              </select>
            </div>
          </div>
        </form>
      </Modal>
    </AppShell>
  );
}
