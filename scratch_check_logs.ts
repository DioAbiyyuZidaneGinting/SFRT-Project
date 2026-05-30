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

  console.log('2. Querying public.email_logs...');
  const { data: logs, error } = await supabase
    .from('email_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('Failed to query email_logs:', error.message, error.details);
    process.exit(1);
  }

  console.log(`Found ${logs?.length || 0} log(s) in email_logs:`);
  
  if (logs && logs.length > 0) {
    logs.forEach((log, idx) => {
      console.log(`\n--- [LOG #${idx + 1}] ---`);
      console.log(`Transaction ID : ${log.transaction_id}`);
      console.log(`Recipient      : ${log.recipient_email}`);
      console.log(`Status         : ${log.status}`);
      console.log(`Attempts       : ${log.attempts}`);
      console.log(`Error Message  : ${log.error_message || 'None'}`);
      console.log(`Created At     : ${log.created_at}`);
      console.log(`Updated At     : ${log.updated_at}`);
    });
  }

  console.log('\n3. Verifying completed transactions in DB...');
  const { data: txs, error: txError } = await supabase
    .from('transactions')
    .select('id, user_id, status, total_price, created_at')
    .order('created_at', { ascending: false })
    .limit(5);

  if (txError) {
    console.error('Failed to query transactions:', txError.message);
  } else {
    console.log(`Recent transactions (${txs?.length || 0} found):`);
    txs?.forEach((tx) => {
      console.log(`- ID: ${tx.id} | User: ${tx.user_id} | Status: ${tx.status} | Total: ${tx.total_price} | Date: ${tx.created_at}`);
    });
  }
}

run();
