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

  console.log(`1. Authenticating as Admin: ${email}...`);
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (authError || !authData.user) {
    console.error('Authentication failed:', authError?.message);
    process.exit(1);
  }

  // We have transaction '29197be9-6a3a-40d5-9ab5-24a31e8ba39b' which is in 'refueling' status.
  const txId = '29197be9-6a3a-40d5-9ab5-24a31e8ba39b';
  console.log(`2. Updating transaction ${txId} status to 'completed'...`);

  const start = Date.now();
  const { data, error } = await supabase
    .from('transactions')
    .update({ status: 'completed' })
    .eq('id', txId)
    .select();

  console.log(`Update query completed in ${Date.now() - start}ms`);

  if (error) {
    console.error('❌ Update failed:', error.message, error.details);
  } else {
    console.log('✅ Update SUCCESS! Returned data:', data);
  }

  console.log('3. Checking if a row was created in public.email_logs...');
  const { data: logs, error: logErr } = await supabase
    .from('email_logs')
    .select('*')
    .eq('transaction_id', txId);

  if (logErr) {
    console.error('Failed to query email_logs:', logErr.message);
  } else {
    console.log(`Logs found for this transaction:`, logs);
  }
}

run();
