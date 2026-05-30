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
  const userId = 'a33a53bf-facc-41c3-a6aa-ac29a5d860c9'; // Verified existing user ID
  console.log(`Using verified user ID: ${userId}`);

  console.log('2. Inserting a test vehicle...');
  
  const testPlate = 'BK ' + Math.floor(1000 + Math.random() * 8999) + ' TEST';
  
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
  const { data, error } = await supabase
    .from('vehicles')
    .insert([payload])
    .select();

  console.log(`Insert completed in ${Date.now() - start}ms`);

  if (error) {
    console.error('Insertion failed:', error.message, error.details);
  } else {
    console.log('Insertion SUCCESS! Data:', data);
  }
}

run();
