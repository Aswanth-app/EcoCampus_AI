const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables from .env.local
const envContent = fs.readFileSync('.env.local', 'utf8');
const urlMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/);
const keyMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.+)/);

const url = urlMatch ? urlMatch[1].trim() : '';
const key = keyMatch ? keyMatch[1].trim() : '';

console.log("--------------------------------------------------");
console.log("ECOCAMPUS AI - PHASE 2 DATABASE SCHEMA VERIFICATION");
console.log("--------------------------------------------------");
console.log("Connecting to Supabase Endpoint:", url);

const supabase = createClient(url, key);

async function verifySupabaseConnection() {
  try {
    const { data, error } = await supabase.from('organizations').select('*').limit(1);
    if (error) {
      if (error.code === '42P01' || error.message.includes('relation "public.organizations" does not exist') || error.code === 'PGRST301') {
        console.log("Note: Database tables need to be applied via Supabase SQL Editor or CLI migration.");
        console.log("Migration File Ready at: supabase/migrations/20260821000000_phase2_ecocampus_schema.sql");
        console.log("Seed File Ready at: supabase/seed.sql");
      } else {
        console.log("Supabase API Response:", error.message, "(Code:", error.code + ")");
      }
    } else {
      console.log("Successfully queried organizations table. Existing rows:", data ? data.length : 0);
    }
  } catch (err) {
    console.error("Execution Exception:", err.message);
  }
}

verifySupabaseConnection();
