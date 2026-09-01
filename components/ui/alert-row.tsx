import React from "react";
import { Alert } from "@/types";
import { Badge } from "./badge";
import { Button } from "./button";
import { StatusIndicator } from "./status-indicator";
import { formatDate, formatFlowRate } from "@/lib/utils";
import { AlertOctagon, AlertTriangle, Info, ArrowRight } from "lucide-react";

export interface AlertRowProps {
  alert: Alert;
  onViewDetails?: (alert: Alert) => void;
}

export const AlertRow: React.FC<AlertRowProps> = ({ alert, onViewDetails }) => {
  const severityBadge = {
    critical: <Badge variant="critical" icon={<AlertOctagon className="w-3 h-3" />}>Critical</Badge>,
    warning: <Badge variant="warning" icon={<AlertTriangle className="w-3 h-3" />}>Warning</Badge>,
    info: <Badge variant="info" icon={<Info className="w-3 h-3" />}>Info</Badge>,
  };

  const statusMap = {
    pending: <StatusIndicator status="warning" label="Pending" size="sm" />,
    investigating: <StatusIndicator status="info" label="Investigating" size="sm" />,
    resolved: <StatusIndicator status="normal" label="Resolved" size="sm" />,
  };

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors gap-3">
      <div className="flex items-start gap-3">
        <div className="mt-0.5">{severityBadge[alert.severity]}</div>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-sm font-semibold text-gray-900">{alert.title}</h4>
            <span className="text-xs text-gray-400">•</span>
            <span className="text-xs font-mono text-gray-500">{alert.deviceUid}</span>
          </div>
          <p className="text-xs text-gray-600 mt-1 line-clamp-1">{alert.message}</p>
          <div className="flex items-center gap-3 text-xs text-gray-500 mt-2">
            <span>Location: <strong className="font-medium text-gray-700">{alert.buildingName} ({alert.locationName})</strong></span>
            <span>Flow: <strong className="font-medium text-gray-900">{formatFlowRate(alert.currentFlowLpm)}</strong></span>
            <span>Detected: {formatDate(alert.detectedAt)}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between md:justify-end gap-3 pt-2 md:pt-0 border-t md:border-t-0 border-gray-100">
        <div>{statusMap[alert.status]}</div>
        {onViewDetails && (
          <Button
            size="sm"
            variant="ghost"
            icon={<ArrowRight className="w-3.5 h-3.5" />}
            onClick={() => onViewDetails(alert)}
          >
            Investigate
          </Button>
        )}
      </div>
    </div>
  );
};
