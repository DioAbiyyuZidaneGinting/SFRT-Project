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
  const email = `testuser_${Date.now()}@sfrt.io`;
  const password = 'TestPassword123!';

  console.log(`1. Signing up test user: ${email}...`);
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: 'Dio Ginting',
      }
    }
  });

  if (signUpError) {
    console.error('Sign up failed:', signUpError.message);
    return;
  }

  console.log(`Sign up success! User ID: ${signUpData.user?.id}`);

  // Create a profile record in public.users if needed
  console.log('2. Inserting profile into users table...');
  const { error: profileError } = await supabase
    .from('users')
    .insert([{
      id: signUpData.user?.id,
      email: email,
      full_name: 'Dio Ginting',
      role: 'customer'
    }]);

  if (profileError) {
    console.warn('Profile insertion warning/error (might already exist/be handled by triggers):', profileError.message);
  }

  console.log('3. Signing in to retrieve token...');
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (signInError) {
    console.error('Sign in failed:', signInError.message);
    return;
  }

  const session = signInData.session;
  console.log('Token retrieved successfully.');

  const headers = {
    'Authorization': `Bearer ${session?.access_token}`
  };

  const queries = [
    "apakah pembayaran disini bisa online dan offline?",
    "Tampilkan riwayat pengisian bahan bakar terakhir saya",
    "Stiker RFID Honda Civic saya gagal scan. Apa yang harus dilakukan?",
    "Kenapa scanner RFID SPBU Surabaya gagal mendeteksi stiker Toyota Avanza saya?",
    "Bisa bayar pengisian Pertamax Turbo pakai QRIS bank apa saja?",
    "Berapa estimasi waktu tunggu antrian di SPBU SFRT Bandung?"
  ];

  for (const query of queries) {
    console.log(`\n=========================================`);
    console.log(`Sending query: "${query}"`);
    console.log(`=========================================`);

    const { data, error } = await supabase.functions.invoke('chat-ai', {
      body: { message: query, history: [] },
      headers
    });

    if (error) {
      console.error('Function execution failed:', error);
    } else {
      console.log('Response:');
      console.log(data.response);
    }
  }
}

run();
