import crypto from "crypto";

/**
 * Generates a SHA-256 hash of a raw device API key for secure verification.
 * Raw API keys are NEVER stored in plaintext in the database or server logs.
 */
export function hashDeviceApiKey(apiKey: string): string {
  if (!apiKey) return "";
  return crypto.createHash("sha256").update(apiKey.trim()).digest("hex");
}

/**
 * Performs timing-safe comparison between expected and actual hash strings
 * to prevent side-channel timing attacks.
 */
export function safeHashCompare(a: string, b: string): boolean {
  if (!a || !b || a.length !== b.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
  } catch {
    return false;
  }
}

/**
 * In-memory sliding window rate limiter.
 * Default: 30 requests per 60 seconds per identifier (IP or Device UID).
 * Compatible with ESP32 5-second interval heartbeat (12 requests/min).
 */
interface RateLimitBucket {
  count: number;
  resetAt: number;
}

const rateLimitMap = new Map<string, RateLimitBucket>();

// Clean up stale entries every 5 minutes to prevent memory leaks
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, bucket] of rateLimitMap.entries()) {
      if (now > bucket.resetAt) {
        rateLimitMap.delete(key);
      }
    }
  }, 5 * 60 * 1000).unref?.();
}

export function checkRateLimit(
  identifier: string,
  limit: number = 30,
  windowMs: number = 60 * 1000
): { allowed: boolean; current: number; remaining: number; resetMs: number } {
  const now = Date.now();
  const bucket = rateLimitMap.get(identifier);

  if (!bucket || now > bucket.resetAt) {
    rateLimitMap.set(identifier, { count: 1, resetAt: now + windowMs });
    return {
      allowed: true,
      current: 1,
      remaining: limit - 1,
      resetMs: windowMs,
    };
  }

  bucket.count += 1;
  const remaining = Math.max(0, limit - bucket.count);
  const resetMs = Math.max(0, bucket.resetAt - now);

  if (bucket.count > limit) {
    return {
      allowed: false,
      current: bucket.count,
      remaining: 0,
      resetMs,
    };
  }

  return {
    allowed: true,
    current: bucket.count,
    remaining,
    resetMs,
  };
}

/**
 * Strict range and sanity validation for telemetry inputs.
 * Ensures physical limits of YF-S201 (max ~30 L/min standard, 120 L/min max manifold burst).
 * Rejects negative values, impossible future timestamps, and invalid formats.
 */
export interface TelemetryValidationResult {
  valid: boolean;
  error?: string;
  sanitized?: {
    flow_rate_lpm: number;
    total_volume_liters: number;
    pulse_count: number;
    timestamp: string;
  };
}

export function validateTelemetryPayload(body: any): TelemetryValidationResult {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { valid: false, error: "JSON payload must be an object" };
  }

  const {
    device_id,
    sensor_id,
    flow_rate_lpm,
    total_volume_liters,
    pulse_count,
    timestamp,
  } = body;

  if (!device_id || typeof device_id !== "string" || !device_id.trim()) {
    return { valid: false, error: "Missing or invalid device_id" };
  }

  if (!sensor_id || typeof sensor_id !== "string" || !sensor_id.trim()) {
    return { valid: false, error: "Missing or invalid sensor_id" };
  }

  // Numerical type checks
  if (
    typeof flow_rate_lpm !== "number" ||
    isNaN(flow_rate_lpm) ||
    !isFinite(flow_rate_lpm) ||
    flow_rate_lpm < 0
  ) {
    return {
      valid: false,
      error: "flow_rate_lpm must be a non-negative numeric value",
    };
  }

  // Physical maximum plausibility check (YF-S201 sensor max rate is 30-120 L/min)
  if (flow_rate_lpm > 120) {
    return {
      valid: false,
      error: `flow_rate_lpm (${flow_rate_lpm}) exceeds physical sensor ceiling (120 L/min)`,
    };
  }

  if (
    typeof total_volume_liters !== "number" ||
    isNaN(total_volume_liters) ||
    !isFinite(total_volume_liters) ||
    total_volume_liters < 0
  ) {
    return {
      valid: false,
      error: "total_volume_liters must be a non-negative numeric value",
    };
  }

  if (
    typeof pulse_count !== "number" ||
    isNaN(pulse_count) ||
    !isFinite(pulse_count) ||
    pulse_count < 0
  ) {
    return {
      valid: false,
      error: "pulse_count must be a non-negative numeric value",
    };
  }

  if (
    !timestamp ||
    typeof timestamp !== "string" ||
    isNaN(Date.parse(timestamp))
  ) {
    return { valid: false, error: "Invalid ISO-8601 timestamp format" };
  }

  // Timestamp skew check: reject timestamps > 5 minutes in future to prevent clock tampering
  const parsedTime = new Date(timestamp).getTime();
  const maxFuture = Date.now() + 5 * 60 * 1000;
  if (parsedTime > maxFuture) {
    return {
      valid: false,
      error: "Timestamp cannot be in the future beyond allowable clock skew (5 min)",
    };
  }

  return {
    valid: true,
    sanitized: {
      flow_rate_lpm: Number(Number(flow_rate_lpm).toFixed(2)),
      total_volume_liters: Number(Number(total_volume_liters).toFixed(3)),
      pulse_count: Math.floor(pulse_count),
      timestamp: new Date(timestamp).toISOString(),
    },
  };
}

