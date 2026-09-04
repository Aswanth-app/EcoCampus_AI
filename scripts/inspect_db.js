const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const envText = fs.readFileSync('.env.local', 'utf8');
const env = {};
envText.split('\n').forEach((line) => {
  const parts = line.trim().split('=');
  const k = parts[0];
  const v = parts.slice(1).join('=');
  if (k && v) env[k.trim()] = v.trim().replace(/^["']|["']$/g, '');
});

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(url, key);

async function check() {
  const { data: maxVol } = await supabase.from('telemetry').select('id, total_volume_liters, pulse_count, flow_rate_lpm, timestamp').order('total_volume_liters', { ascending: false }).limit(5);
  console.log('TOP 5 VOLUME RECORDS IN DB:', maxVol);

  const { data: nonZero } = await supabase.from('telemetry').select('id, total_volume_liters, pulse_count, flow_rate_lpm, timestamp').gt('pulse_count', 0).order('id', { ascending: false }).limit(5);
  console.log('LATEST 5 NON-ZERO PULSES:', nonZero);
}

check();
