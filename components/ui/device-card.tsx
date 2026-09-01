import React from "react";
import { Device } from "@/types";
import { StatusIndicator } from "./status-indicator";
import { formatDate } from "@/lib/utils";
import { Cpu, MapPin, Activity, Settings } from "lucide-react";
import { Button } from "./button";

export interface DeviceCardProps {
  device: Device;
  onViewDetails?: (device: Device) => void;
}

export const DeviceCard: React.FC<DeviceCardProps> = ({ device, onViewDetails }) => {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gray-100 text-gray-700">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-900 font-mono">{device.deviceUid}</h4>
              <span className="text-xs text-gray-500">{device.deviceType} • {device.firmwareVersion}</span>
            </div>
          </div>
          <StatusIndicator status={device.status} size="sm" />
        </div>

        <div className="space-y-2 my-4 text-xs text-gray-600">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <span className="truncate">
              {device.buildingName} $\rightarrow$ {device.locationName}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <span>Resource: <strong className="font-medium text-emerald-800">Water (YF-S201 Sensor)</strong></span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-gray-100 text-xs">
        <span className="text-gray-400">Last seen: {formatDate(device.lastSeenAt)}</span>
        {onViewDetails && (
          <Button size="sm" variant="outline" icon={<Settings className="w-3.5 h-3.5" />} onClick={() => onViewDetails(device)}>
            Manage
          </Button>
        )}
      </div>
    </div>
  );
};
