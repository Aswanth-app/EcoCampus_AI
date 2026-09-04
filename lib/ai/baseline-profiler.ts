/**
 * EcoCampus AI — Water Baseline Profiler
 * Computes diurnal (hourly) baseline expected flow bands with safe cold-start fallback.
 * Strictly sensor-agnostic, operating exclusively on normalized flow_rate_lpm and timestamps.
 */

import type { BaselineProfile, NormalizedTelemetry } from "@/types";

// Minimum number of historical readings required in an hourly bucket to qualify as "learned"
const MIN_SAMPLES_FOR_LEARNED_BASELINE = 6;

/**
 * Location-specific diurnal default baseline models.
 * Used during cold-start or when historical data for the specific hour is sparse.
 */
interface DefaultDiurnalBand {
  meanLpm: number;
  maxNormalLpm: number;
}

const RESTROOM_DEFAULT_DIURNAL: Record<number, DefaultDiurnalBand> = {
  0: { meanLpm: 0.0, maxNormalLpm: 0.5 },
  1: { meanLpm: 0.0, maxNormalLpm: 0.5 },
  2: { meanLpm: 0.0, maxNormalLpm: 0.5 },
  3: { meanLpm: 0.0, maxNormalLpm: 0.5 },
  4: { meanLpm: 0.0, maxNormalLpm: 0.5 },
  5: { meanLpm: 0.2, maxNormalLpm: 1.5 },
  6: { meanLpm: 1.5, maxNormalLpm: 6.0 },
  7: { meanLpm: 4.5, maxNormalLpm: 12.0 },
  8: { meanLpm: 6.0, maxNormalLpm: 15.0 },
  9: { meanLpm: 5.0, maxNormalLpm: 14.0 },
  10: { meanLpm: 3.5, maxNormalLpm: 10.0 },
  11: { meanLpm: 4.0, maxNormalLpm: 11.0 },
  12: { meanLpm: 5.5, maxNormalLpm: 14.0 },
  13: { meanLpm: 5.0, maxNormalLpm: 13.0 },
  14: { meanLpm: 3.5, maxNormalLpm: 10.0 },
  15: { meanLpm: 3.0, maxNormalLpm: 9.0 },
  16: { meanLpm: 4.0, maxNormalLpm: 11.0 },
  17: { meanLpm: 5.0, maxNormalLpm: 13.0 },
  18: { meanLpm: 6.0, maxNormalLpm: 15.0 },
  19: { meanLpm: 5.5, maxNormalLpm: 14.0 },
  20: { meanLpm: 4.5, maxNormalLpm: 12.0 },
  21: { meanLpm: 3.0, maxNormalLpm: 8.0 },
  22: { meanLpm: 1.5, maxNormalLpm: 5.0 },
  23: { meanLpm: 0.5, maxNormalLpm: 2.0 },
};

/**
 * Returns a fallback/default baseline profile when historical data is absent or insufficient.
 */
export function getDefaultBaselineProfile(
  hourOfDay: number,
  isWeekend: boolean,
  locationType: string = "restroom"
): BaselineProfile {
  const hour = Math.max(0, Math.min(23, hourOfDay));
  const band = RESTROOM_DEFAULT_DIURNAL[hour] || { meanLpm: 1.0, maxNormalLpm: 5.0 };

  // Weekend reduction factor (~30% lower occupancy in academic buildings)
  const weekendFactor = isWeekend ? 0.7 : 1.0;
  const mean = Number((band.meanLpm * weekendFactor).toFixed(2));
  const maxNormal = Number((band.maxNormalLpm * weekendFactor).toFixed(2));
  const stdDev = Number(((maxNormal - mean) / 2).toFixed(2));

  return {
    hourOfDay: hour,
    isWeekend,
    meanFlowLpm: mean,
    stdDevLpm: stdDev,
    minExpectedLpm: 0.0,
    maxExpectedLpm: maxNormal,
    isLearned: false,
    sampleCount: 0,
    locationType,
  };
}

/**
 * Computes a dynamic Baseline Profile for the target timestamp.
 * If telemetry history contains >= MIN_SAMPLES_FOR_LEARNED_BASELINE in the matching hourly window,
 * a learned Gaussian band (\mu \pm 2\sigma) is returned.
 * Otherwise, gracefully falls back to the location-aware default baseline.
 */
export function computeBaselineProfile(
  telemetryHistory: NormalizedTelemetry[],
  targetTimestamp: string,
  locationType: string = "restroom"
): BaselineProfile {
  const targetDate = new Date(targetTimestamp);
  const targetHour = isNaN(targetDate.getTime()) ? new Date().getUTCHours() : targetDate.getUTCHours();
  const dayOfWeek = isNaN(targetDate.getTime()) ? new Date().getUTCDay() : targetDate.getUTCDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  // Filter telemetry history matching the target hourly window (and same weekend/weekday class)
  const matchingSamples = telemetryHistory.filter((rec) => {
    if (!rec.timestamp) return false;
    const d = new Date(rec.timestamp);
    if (isNaN(d.getTime())) return false;
    const sampleHour = d.getUTCHours();
    const sampleDay = d.getUTCDay();
    const sampleIsWeekend = sampleDay === 0 || sampleDay === 6;

    // Match hourly bucket (+/- 1 hour tolerance to smooth boundaries)
    const hourDiff = Math.abs(sampleHour - targetHour);
    const isHourMatch = hourDiff === 0 || hourDiff === 1 || hourDiff === 23;
    return isHourMatch && sampleIsWeekend === isWeekend;
  });

  // Cold-Start Check: insufficient historical sample count
  if (matchingSamples.length < MIN_SAMPLES_FOR_LEARNED_BASELINE) {
    return getDefaultBaselineProfile(targetHour, isWeekend, locationType);
  }

  // Calculate empirical statistics from learned history
  const flows = matchingSamples.map((s) => Number(s.flow_rate_lpm) || 0);
  const count = flows.length;
  const sum = flows.reduce((acc, v) => acc + v, 0);
  const mean = sum / count;

  const variance = flows.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / count;
  const stdDev = Math.sqrt(variance);

  // Normal upper bound defined as mean + 2 * stdDev (95.4% empirical interval)
  const minExpected = Math.max(0, Number((mean - 2 * stdDev).toFixed(2)));
  const maxExpected = Math.max(1.0, Number((mean + 2 * stdDev).toFixed(2)));

  return {
    hourOfDay: targetHour,
    isWeekend,
    meanFlowLpm: Number(mean.toFixed(2)),
    stdDevLpm: Number(stdDev.toFixed(2)),
    minExpectedLpm: minExpected,
    maxExpectedLpm: maxExpected,
    isLearned: true,
    sampleCount: count,
    locationType,
  };
}
