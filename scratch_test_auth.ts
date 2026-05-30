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
  const email = `testadmin_${Date.now()}@sfrt.io`;
  const password = 'TestPassword123!';

  console.log(`1. Signing up test admin: ${email}...`);
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: 'TEST ADMIN USER',
      }
    }
  });

  if (signUpError) {
    console.error('Sign up failed:', signUpError.message);
    return;
  }

  const userId = signUpData.user?.id;
  console.log(`Sign up success! User ID: ${userId}`);

  console.log('2. Signing in with password...');
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (signInError) {
    console.error('Sign in failed:', signInError.message);
    return;
  }

  console.log('Sign in success! Token active in client.');

  console.log('3. Attempting to fetch own profile from public.users using the authenticated client...');
  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('full_name, role, avatar_url')
    .eq('id', userId)
    .single();

  if (profileError) {
    console.error('Profile fetch failed:', profileError.message, profileError.details);
  } else {
    console.log('Profile fetch success! Profile row:', profile);
  }

  // Clean up if we want, but let's keep it so we can verify if the user exists.
}

run();
