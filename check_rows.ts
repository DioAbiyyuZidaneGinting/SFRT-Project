import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  const stationId = '6498266a-3200-4669-9ffa-d6e52c57bef8';
  const userId = '12921850-cb99-4c35-939b-98f86e693cbc';
  const txId = crypto.randomUUID();

  console.log('Testing queue_sessions.queue_number with string "Q-123"...');
  const { error: qsErr } = await supabase.from('queue_sessions').insert([{
    id: crypto.randomUUID(),
    transaction_id: txId,
    station_id: stationId,
    user_id: userId,
    status: 'waiting',
    queue_number: 'Q-123'
  }]);

  console.log('Result for queue_sessions.queue_number with "Q-123":', qsErr ? qsErr.message : 'SUCCESS');
}

run();
