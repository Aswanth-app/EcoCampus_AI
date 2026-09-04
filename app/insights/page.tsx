"use client";

import React from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { InsightCard } from "@/components/ui/insight-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useWaterAi } from "@/lib/use-water-ai";
import { MOCK_INSIGHTS } from "@/data/mock-data";
import { Sparkles, Info, Radio, Activity } from "lucide-react";

export default function InsightsPage() {
  const { liveInsight, isOnline, riskLevel, riskScore } = useWaterAi(6000);

  // Combine live hardware insight at the top with campus facility recommendations
  const allInsights = liveInsight
    ? [liveInsight, ...MOCK_INSIGHTS.filter((i) => i.id !== "ins_01")]
    : MOCK_INSIGHTS;

  return (
    <AppShell>
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: "Eco Flux University" },
          { label: "Main Campus" },
          { label: "AI Resource Insights", href: "/insights" },
        ]}
      />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-2xl font-bold tracking-tight text-gray-900">Resource Intelligence Insights</h2>
            {isOnline ? (
              <Badge variant="normal" icon={<Radio className="w-3.5 h-3.5 animate-pulse text-emerald-600" />}>
                Live Intelligence Active (Risk: {riskLevel})
              </Badge>
            ) : (
              <Badge variant="neutral" icon={<Activity className="w-3.5 h-3.5 text-gray-500" />}>
                Hardware Node Standby
              </Badge>
            )}
          </div>
          <p className="text-sm text-gray-500">
            Rule-based intelligence surfacing continuous off-peak wastage, avoidable volume estimates, and recommended facility actions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => (window.location.href = "/alerts")}>
            View Active Alerts
          </Button>
          <Button variant="primary" size="sm" onClick={() => (window.location.href = "/water")}>
            Water Analytics
          </Button>
        </div>
      </div>

      {/* Notice regarding Rule-Based Intelligence */}
      <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 flex items-start gap-3 text-xs text-blue-950">
        <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold block text-blue-900">Explainable Multi-Rule Intelligence Engine</span>
          <p className="text-blue-800 mt-0.5">
            The EcoCampus AI Water Intelligence engine evaluates active telemetry against learned Gaussian baselines, continuous flow duration rules, and diurnal off-peak windows.
          </p>
        </div>
      </div>

      {/* Insights Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {allInsights.map((insight) => (
          <InsightCard
            key={insight.id}
            insight={insight}
            onAction={() => (window.location.href = "/water")}
          />
        ))}
      </div>
    </AppShell>
  );
}
