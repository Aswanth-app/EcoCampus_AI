import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat("en-US").format(num);
}

export function formatVolume(liters: number): string {
  if (liters >= 1000) {
    return `${(liters / 1000).toFixed(1)} m³ (${formatNumber(liters)} L)`;
  }
  return `${formatNumber(Math.round(liters))} L`;
}

export function formatFlowRate(lpm: number): string {
  return `${lpm.toFixed(1)} L/min`;
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
