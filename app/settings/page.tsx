"use client";

import React, { useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MOCK_CURRENT_USER, MOCK_ORGANIZATION } from "@/data/mock-data";
import { Settings, Building2, User, Bell, Sliders, Shield } from "lucide-react";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<"org" | "profile" | "notifications" | "thresholds">("org");

  return (
    <AppShell>
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: "Eco Flux University" },
          { label: "Settings & System Preferences", href: "/settings" },
        ]}
      />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-2xl font-bold tracking-tight text-gray-900">Settings & Threshold Configuration</h2>
            <Badge variant="neutral" icon={<Settings className="w-3.5 h-3.5" />}>Tenant Preferences</Badge>
          </div>
          <p className="text-sm text-gray-500">
            Manage organization details, user profile, alert notification preferences, and anomaly detection rules.
          </p>
        </div>
      </div>

      {/* Settings Layout with Side Navigation */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Navigation Tabs */}
        <div className="md:col-span-1 space-y-1">
          {[
            { id: "org", label: "Organization Profile", icon: Building2 },
            { id: "profile", label: "User Account Profile", icon: User },
            { id: "notifications", label: "Alert Notifications", icon: Bell },
            { id: "thresholds", label: "Anomaly Threshold Rules", icon: Sliders },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === tab.id
                    ? "bg-[#0B6B4F] text-white shadow-xs"
                    : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200/80"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content Box */}
        <div className="md:col-span-3 bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-6">
          {activeTab === "org" && (
            <div className="space-y-4">
              <div className="pb-3 border-b border-gray-100">
                <h3 className="text-base font-semibold text-gray-900">Organization Settings</h3>
                <p className="text-xs text-gray-500">Customer tenant identity and institutional details.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Organization Name" defaultValue={MOCK_ORGANIZATION.name} />
                <Input label="Organization Code" defaultValue={MOCK_ORGANIZATION.code} />
                <Input label="Primary Admin Email" defaultValue={MOCK_CURRENT_USER.email} />
                <Input label="Total Campuses Registered" defaultValue={MOCK_ORGANIZATION.campusesCount.toString()} disabled />
              </div>

              <div className="pt-2 flex justify-end">
                <Button variant="primary" size="sm" onClick={() => alert("Organization settings updated.")}>
                  Save Organization Changes
                </Button>
              </div>
            </div>
          )}

          {activeTab === "profile" && (
            <div className="space-y-4">
              <div className="pb-3 border-b border-gray-100">
                <h3 className="text-base font-semibold text-gray-900">User Profile</h3>
                <p className="text-xs text-gray-500">Your account identity and role assignments.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Full Name" defaultValue={MOCK_CURRENT_USER.name} />
                <Input label="Email Address" defaultValue={MOCK_CURRENT_USER.email} />
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Assigned Role</label>
                  <input
                    type="text"
                    value="Facility Manager (Operational Monitoring & Resolution)"
                    disabled
                    className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2 text-xs font-semibold text-gray-800"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <Button variant="primary" size="sm" onClick={() => alert("Profile updated.")}>
                  Update Profile
                </Button>
              </div>
            </div>
          )}

          {activeTab === "notifications" && (
            <div className="space-y-4">
              <div className="pb-3 border-b border-gray-100">
                <h3 className="text-base font-semibold text-gray-900">Alert & Notification Subscriptions</h3>
                <p className="text-xs text-gray-500">Configure how and when facility personnel receive notifications.</p>
              </div>

              <div className="space-y-3 text-xs text-gray-700">
                <label className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer">
                  <div>
                    <span className="font-semibold text-gray-900 block">Critical Continuous Leak Alerts</span>
                    <span className="text-gray-500">Immediate notification when continuous off-peak flow exceeds 5 minutes.</span>
                  </div>
                  <input type="checkbox" defaultChecked className="w-4 h-4 text-[#0B6B4F] rounded-md" />
                </label>

                <label className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer">
                  <div>
                    <span className="font-semibold text-gray-900 block">Device Offline Heartbeat Failure</span>
                    <span className="text-gray-500">Alert when a node transmits no telemetry for over 60 seconds.</span>
                  </div>
                  <input type="checkbox" defaultChecked className="w-4 h-4 text-[#0B6B4F] rounded-md" />
                </label>
              </div>
            </div>
          )}

          {activeTab === "thresholds" && (
            <div className="space-y-4">
              <div className="pb-3 border-b border-gray-100">
                <h3 className="text-base font-semibold text-gray-900">Rule-Based Anomaly Detection Thresholds</h3>
                <p className="text-xs text-gray-500">Tune parameters for water leak evaluation window and critical flow limits.</p>
              </div>

              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-medium text-gray-700 mb-1">Off-Peak Hours Window</label>
                    <div className="flex items-center gap-2">
                      <input type="time" defaultValue="01:00" className="border border-gray-300 rounded-lg p-2 text-xs w-full" />
                      <span>to</span>
                      <input type="time" defaultValue="04:00" className="border border-gray-300 rounded-lg p-2 text-xs w-full" />
                    </div>
                  </div>

                  <div>
                    <label className="block font-medium text-gray-700 mb-1">Consecutive Telemetry Window (Minutes)</label>
                    <input type="number" defaultValue={5} className="border border-gray-300 rounded-lg p-2 text-xs w-full font-mono" />
                    <span className="text-[10px] text-gray-500">At 10s interval = 30 consecutive observations</span>
                  </div>

                  <div>
                    <label className="block font-medium text-gray-700 mb-1">Critical High Flow Rate Limit (L/min)</label>
                    <input type="number" defaultValue={30.0} className="border border-gray-300 rounded-lg p-2 text-xs w-full font-mono" />
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <Button variant="primary" size="sm" onClick={() => alert("Anomaly thresholds updated.")}>
                    Apply Threshold Rules
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
