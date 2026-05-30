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
  const email = 'testadmin_1779891928145@sfrt.io'; // The admin we created earlier
  const password = 'TestPassword123!';

  console.log(`1. Authenticating as ${email}...`);
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (signInError || !signInData.user) {
    console.error('Sign in failed:', signInError?.message);
    process.exit(1);
  }

  const userId = signInData.user.id;
  console.log(`Sign in successful. User ID: ${userId}`);

  console.log('2. Inserting a test vehicle as the authenticated user...');
  const testPlate = 'BK ' + Math.floor(1000 + Math.random() * 8999) + ' AUTH';
  
  const payload = {
    user_id: userId,
    plate_number: testPlate,
    vehicle_type: 'car',
    brand: 'Ferrari',
    model: 'Ferrari F80',
    fuel_type_preference: 'Pertamax Turbo',
    tank_capacity: 45,
    current_fuel_level: 50,
    is_verified: false
  };

  const start = Date.now();
  
  // Set up a 10s safety timeout in the test script as well
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error("Database Insert HANGED (10s timeout reached)")), 10000);
  });

  const fetchPromise = supabase
    .from('vehicles')
    .insert([payload])
    .select();

  try {
    const { data, error } = await Promise.race([fetchPromise, timeoutPromise]) as any;
    console.log(`Insert query completed in ${Date.now() - start}ms`);
    
    if (error) {
      console.error('Insertion failed:', error.message, error.details);
    } else {
      console.log('Insertion SUCCESS! Data:', data);
    }
  } catch (err: any) {
    console.error('Test caught error:', err.message);
  }
}

run();
