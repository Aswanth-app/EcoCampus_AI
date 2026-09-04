"use client";

import React from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { InsightCard } from "@/components/ui/insight-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MOCK_INSIGHTS } from "@/data/mock-data";
import { Sparkles, Info, ArrowRight } from "lucide-react";

export default function InsightsPage() {
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
            <Badge variant="normal" icon={<Sparkles className="w-3.5 h-3.5" />}>Context-Aware Engine</Badge>
          </div>
          <p className="text-sm text-gray-500">
            Rule-based intelligence surfacing continuous off-peak wastage, avoidable volume estimates, and recommended facility actions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => (window.location.href = "/alerts")}>
            View Active Alerts
          </Button>
        </div>
      </div>

      {/* Notice regarding ML Evolution */}
      <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 flex items-start gap-3 text-xs text-blue-950">
        <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold block text-blue-900">Rule-Based Intelligence Transparency</span>
          <p className="text-blue-800 mt-0.5">
            The Phase 1 Water MVP uses rule-based anomaly evaluation (consecutive observations over 5-minute off-peak windows). Advanced predictive ML forecasting models are structured for introduction in Phase 4.
          </p>
        </div>
      </div>

      {/* Insights Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {MOCK_INSIGHTS.map((insight) => (
          <InsightCard
            key={insight.id}
            insight={insight}
            onAction={() => (window.location.href = "/alerts")}
          />
        ))}
      </div>
    </AppShell>
  );
}
