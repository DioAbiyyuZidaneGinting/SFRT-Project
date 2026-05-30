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
  const email = 'testadmin_1779891928145@sfrt.io';
  const password = 'TestPassword123!';

  console.log(`1. Authenticating as Admin...`);
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (authError || !authData.user) {
    console.error('Authentication failed:', authError?.message);
    process.exit(1);
  }

  console.log('2. Querying trigger existence on transactions table via SQL metadata...');
  
  // Since we cannot run raw SQL directly through anon client without RPC, let's see if we can get list of active triggers or trigger functions by querying another catalog.
  // Wait! Do we have a way to check if public.email_logs exists or is writable?
  // Let's try to insert directly to email_logs to see if it works and RLS is fine.
  console.log('Testing direct insert to public.email_logs...');
  const { data: insData, error: insErr } = await supabase
    .from('email_logs')
    .insert([{
      transaction_id: '29197be9-6a3a-40d5-9ab5-24a31e8ba39b',
      user_id: 'ea5f4d30-1af4-4477-9b43-fc4c73ee4de6',
      recipient_email: 'test@example.com',
      email_type: 'receipt',
      status: 'pending'
    }])
    .select();

  if (insErr) {
    console.error('❌ Direct insert to email_logs failed:', insErr.message, insErr.details);
  } else {
    console.log('✅ Direct insert to email_logs SUCCESS! Data:', insData);
  }
}

run();
