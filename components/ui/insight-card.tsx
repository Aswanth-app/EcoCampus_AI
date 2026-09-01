import React from "react";
import { Insight } from "@/types";
import { Sparkles, ArrowRight, Droplets } from "lucide-react";
import { Button } from "./button";
import { formatVolume } from "@/lib/utils";

export interface InsightCardProps {
  insight: Insight;
  onAction?: (insight: Insight) => void;
}

export const InsightCard: React.FC<InsightCardProps> = ({ insight, onAction }) => {
  return (
    <div className="bg-gradient-to-br from-emerald-50/90 via-white to-white rounded-xl border border-emerald-200/80 p-5 shadow-xs flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#0B6B4F]">
            <Sparkles className="w-4 h-4 text-[#0B6B4F]" />
            <span>AI Resource Insight</span>
          </div>
          <span className="text-xs text-emerald-800 font-medium bg-emerald-100/80 px-2 py-0.5 rounded-md">
            Rule-Based
          </span>
        </div>

        <h4 className="text-base font-semibold text-gray-900 mb-1">{insight.title}</h4>
        <p className="text-xs text-gray-600 mb-3">
          Location: <strong className="font-medium text-gray-800">{insight.buildingName} — {insight.locationName}</strong>
        </p>

        <div className="p-3 rounded-lg bg-white border border-emerald-100 mb-4 space-y-1.5 text-xs">
          <div className="flex items-center gap-1.5 text-emerald-900 font-medium">
            <Droplets className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Potential Avoidable Waste: <strong>{formatVolume(insight.avoidableVolumeLiters)}</strong></span>
          </div>
          <p className="text-gray-600 pl-5">
            <strong>Recommended Action:</strong> {insight.recommendedAction}
          </p>
        </div>
      </div>

      {onAction && (
        <div className="pt-2 border-t border-emerald-100 flex justify-end">
          <Button
            size="sm"
            variant="primary"
            icon={<ArrowRight className="w-3.5 h-3.5" />}
            onClick={() => onAction(insight)}
          >
            Take Action
          </Button>
        </div>
      )}
    </div>
  );
};
