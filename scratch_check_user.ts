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
  console.log('Checking all rows in public.users:');
  const { data: allUsers, error: allErr } = await supabase
    .from('users')
    .select('id, email, role, full_name');
  
  if (allErr) {
    console.error('Error fetching all users:', allErr.message);
  } else {
    console.log('All Users:', allUsers);
  }
}

run();
