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
  console.log('Querying pg_stat_activity for active/blocked queries...');
  
  // Note: Standard anon key might not have permission to read pg_stat_activity.
  // Let's try it anyway or print the error.
  const { data, error } = await supabase.rpc('get_active_locks_or_queries');

  if (error) {
    console.log('RPC check failed (expected if not defined):', error.message);
    
    // Let's try raw select if possible (PostgREST might not expose system views directly)
    console.log('Attempting to read from public tables to check performance...');
    
    const start = Date.now();
    const { data: vehicles, error: vErr } = await supabase
      .from('vehicles')
      .select('*')
      .limit(1);
    
    console.log(`Select vehicles time: ${Date.now() - start}ms`);
    if (vErr) {
      console.error('Vehicles select error:', vErr.message);
    } else {
      console.log('Vehicles rows found:', vehicles.length);
    }
  } else {
    console.log('Locks/Queries status:', data);
  }
}

run();
