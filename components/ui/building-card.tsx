import React from "react";
import { Building } from "@/types";
import { StatusIndicator } from "./status-indicator";
import { formatVolume, formatFlowRate } from "@/lib/utils";
import { Building2, Cpu, AlertTriangle, ArrowRight } from "lucide-react";
import { Button } from "./button";

export interface BuildingCardProps {
  building: Building;
  onSelect?: (building: Building) => void;
}

export const BuildingCard: React.FC<BuildingCardProps> = ({ building, onSelect }) => {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs hover:shadow-md hover:border-gray-300 transition-all flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-emerald-50 text-[#0B6B4F]">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-base font-semibold text-gray-900">{building.name}</h4>
              <span className="text-xs text-gray-500 font-mono">{building.code} • {building.campusName}</span>
            </div>
          </div>
          <StatusIndicator status={building.status} size="sm" />
        </div>

        <div className="grid grid-cols-2 gap-3 my-4 p-3 rounded-lg bg-gray-50/80 border border-gray-100 text-xs">
          <div>
            <span className="text-gray-500 block">Today's Usage</span>
            <span className="font-semibold text-gray-900 text-sm">{formatVolume(building.waterUsageTodayLiters)}</span>
          </div>
          <div>
            <span className="text-gray-500 block">Current Flow</span>
            <span className="font-semibold text-gray-900 text-sm">{formatFlowRate(building.currentFlowLpm)}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-gray-100 text-xs text-gray-500">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <Cpu className="w-3.5 h-3.5 text-gray-400" />
            {building.devicesOnlineCount} / {building.devicesCount} Online
          </span>
          {building.activeAlertsCount > 0 && (
            <span className="flex items-center gap-1 text-red-600 font-medium">
              <AlertTriangle className="w-3.5 h-3.5" />
              {building.activeAlertsCount} Alert{building.activeAlertsCount > 1 ? "s" : ""}
            </span>
          )}
        </div>

        {onSelect && (
          <Button size="sm" variant="ghost" icon={<ArrowRight className="w-3.5 h-3.5" />} onClick={() => onSelect(building)}>
            Details
          </Button>
        )}
      </div>
    </div>
  );
};
