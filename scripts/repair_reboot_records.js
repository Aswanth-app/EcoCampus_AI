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

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function repairZeroRebootRecords() {
  const { data: zeroRecords } = await supabase
    .from('telemetry')
    .select('id, pulse_count, total_volume_liters')
    .gt('id', 1129)
    .eq('pulse_count', 0);

  console.log('Zero records found after ID 1129:', zeroRecords ? zeroRecords.length : 0);

  if (zeroRecords && zeroRecords.length > 0) {
    const ids = zeroRecords.map((r) => r.id);
    const { error } = await supabase
      .from('telemetry')
      .update({ pulse_count: 11470, total_volume_liters: 25.49 })
      .in('id', ids);
    console.log('Database update result error:', error);
  }

  const { data: latest } = await supabase.from('telemetry').select('*').order('id', { ascending: false }).limit(3);
  console.log('--- REPAIRED LATEST 3 RECORDS ---');
  console.log(latest);
}

repairZeroRebootRecords();
