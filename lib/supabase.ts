import { createClient } from "@supabase/supabase-js";

// Retrieve public environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

// Retrieve server-only service role key (NEVER expose to client)
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

/**
 * Check whether Supabase environment variables are configured.
 */
export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
    supabaseUrl !== "https://your-project-id.supabase.co" &&
    supabaseAnonKey &&
    supabaseAnonKey !== "your-publishable-anon-key"
);

/**
 * Reusable Supabase Public Client Instance
 * Uses public anon key only. Secret service keys must NEVER be exposed here.
 */
export const supabase = createClient(
  supabaseUrl || "https://placeholder-project.supabase.co",
  supabaseAnonKey || "placeholder-anon-key",
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

/**
 * Check whether Supabase Admin Service Role environment variable is configured.
 */
export const isSupabaseAdminConfigured = Boolean(
  supabaseUrl &&
    supabaseUrl !== "https://your-project-id.supabase.co" &&
    supabaseServiceRoleKey &&
    supabaseServiceRoleKey !== "your-service-role-key"
);

/**
 * Server-Only Supabase Admin Client Instance
 * Uses service role key to bypass Row Level Security (RLS) for trusted backend operations
 * (e.g. device lookup, telemetry ingestion, system alerts).
 * MUST NOT be imported or used in client components.
 */
export const supabaseAdmin = createClient(
  supabaseUrl || "https://placeholder-project.supabase.co",
  supabaseServiceRoleKey || supabaseAnonKey || "placeholder-service-key",
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

