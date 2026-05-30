-- ==========================================
-- SUPABASE SCHEMA & RLS SETUP SCRIPT (Idempotent Version)
-- Execute this in your Supabase SQL Editor
-- ==========================================

-- 1. Enable RLS on all relevant tables
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.queue_sessions ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to prevent "already exists" errors if re-run
DROP POLICY IF EXISTS "Users can view their own vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Users can insert their own vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Users can update their own vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Users can delete their own vehicles" ON public.vehicles;

DROP POLICY IF EXISTS "Users can view their own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can insert their own transactions" ON public.transactions;

DROP POLICY IF EXISTS "Users can view queue sessions" ON public.queue_sessions;
DROP POLICY IF EXISTS "Users can join queue" ON public.queue_sessions;

-- 3. Vehicles Policies
CREATE POLICY "Users can view their own vehicles" ON public.vehicles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own vehicles" ON public.vehicles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own vehicles" ON public.vehicles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own vehicles" ON public.vehicles FOR DELETE USING (auth.uid() = user_id);

-- 4. Transactions Policies
CREATE POLICY "Users can view their own transactions" ON public.transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own transactions" ON public.transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own transactions" ON public.transactions FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 5. Queue Sessions Policies
CREATE POLICY "Users can view queue sessions" ON public.queue_sessions FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can join queue" ON public.queue_sessions FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 6. Unique Constraints (Handling existing ones safely)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_constraint 
    WHERE conname = 'vehicles_plate_number_key'
  ) THEN
    ALTER TABLE public.vehicles ADD CONSTRAINT vehicles_plate_number_key UNIQUE (user_id, plate_number);
  END IF;
END $$;

-- 7. Ensure frontend payload columns exist
DO $$ 
BEGIN
  -- Add 'model' column if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='vehicles' AND column_name='model') THEN
    ALTER TABLE public.vehicles ADD COLUMN model VARCHAR(255);
  END IF;

  -- Add 'tank_capacity' column if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='vehicles' AND column_name='tank_capacity') THEN
    ALTER TABLE public.vehicles ADD COLUMN tank_capacity INT;
  END IF;

  -- Add 'current_fuel_level' column if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='vehicles' AND column_name='current_fuel_level') THEN
    ALTER TABLE public.vehicles ADD COLUMN current_fuel_level INT DEFAULT 50;
  END IF;

  -- Add 'type' column if missing (legacy fallback)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='vehicles' AND column_name='type') THEN
    ALTER TABLE public.vehicles ADD COLUMN type VARCHAR(50);
  END IF;

  -- Add 'fuel_preference' column if missing (legacy fallback)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='vehicles' AND column_name='fuel_preference') THEN
    ALTER TABLE public.vehicles ADD COLUMN fuel_preference VARCHAR(100);
  END IF;
END $$;

-- 8. Clean up Legacy Columns
ALTER TABLE public.vehicles DROP COLUMN IF EXISTS type;
ALTER TABLE public.vehicles DROP COLUMN IF EXISTS fuel_preference;

-- ==========================================
-- DYNAMIC FUEL & CHECKOUT TELEMETRY SCHEMA
-- ==========================================

-- 9. Fuel Types Reference Table
CREATE TABLE IF NOT EXISTS public.fuel_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  ron_rating INT,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed basic fuels if empty
INSERT INTO public.fuel_types (name, ron_rating, description)
SELECT 'Pertalite', 90, 'RON 90 fuel. Cost-effective environmental rating for commercial commuters.'
WHERE NOT EXISTS (SELECT 1 FROM public.fuel_types WHERE name = 'Pertalite');

INSERT INTO public.fuel_types (name, ron_rating, description)
SELECT 'Pertamax', 92, 'RON 92 fuel. Optimized multi-port exhaust thermal expansion values.'
WHERE NOT EXISTS (SELECT 1 FROM public.fuel_types WHERE name = 'Pertamax');

INSERT INTO public.fuel_types (name, ron_rating, description)
SELECT 'Pertamax Turbo', 98, 'RON 98 fuel. High-speed hydraulic nozzle flow specs. Essential for sports telemetry.'
WHERE NOT EXISTS (SELECT 1 FROM public.fuel_types WHERE name = 'Pertamax Turbo');

INSERT INTO public.fuel_types (name, ron_rating, description)
SELECT 'Solar', 48, 'CN 48 Diesel mix. Generous mechanical payload outputs with structural compression ratios.'
WHERE NOT EXISTS (SELECT 1 FROM public.fuel_types WHERE name = 'Solar');

-- 10. Station Fuels (Many-to-Many with Pricing & Stock)
CREATE TABLE IF NOT EXISTS public.station_fuels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  station_id UUID REFERENCES public.stations(id) ON DELETE CASCADE,
  fuel_type_id UUID REFERENCES public.fuel_types(id) ON DELETE CASCADE,
  stock_liters DECIMAL(10,2) DEFAULT 0,
  price_per_liter DECIMAL(10,2) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(station_id, fuel_type_id)
);

-- Seed default station if none exist
INSERT INTO public.stations (id, name, address, location_lat, location_lng, status)
SELECT 
  gen_random_uuid(), 
  'SFRT - Central Hub', 
  'Jl. Sudirman No.1, Jakarta', 
  -6.2088, 
  106.8456, 
  'operational'
WHERE NOT EXISTS (SELECT 1 FROM public.stations);

-- Seed station_fuels automatically for all existing stations with default pricing
INSERT INTO public.station_fuels (station_id, fuel_type_id, stock_liters, price_per_liter)
SELECT 
  s.id as station_id,
  f.id as fuel_type_id,
  5000.00 as stock_liters, -- default mock stock
  CASE 
    WHEN f.name = 'Pertalite' THEN 10000.00
    WHEN f.name = 'Pertamax' THEN 12500.00
    WHEN f.name = 'Pertamax Turbo' THEN 14850.00
    WHEN f.name = 'Solar' THEN 6800.00
    ELSE 10000.00
  END as price_per_liter
FROM public.stations s
CROSS JOIN public.fuel_types f
ON CONFLICT (station_id, fuel_type_id) DO NOTHING;

-- 11. Transaction Schema Updates
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transactions' AND column_name='compatibility_score') THEN
    ALTER TABLE public.transactions ADD COLUMN compatibility_score INT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transactions' AND column_name='liters_selected') THEN
    ALTER TABLE public.transactions ADD COLUMN liters_selected DECIMAL(10,2);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transactions' AND column_name='fuel_type') THEN
    ALTER TABLE public.transactions ADD COLUMN fuel_type VARCHAR(100);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transactions' AND column_name='price_per_liter') THEN
    ALTER TABLE public.transactions ADD COLUMN price_per_liter DECIMAL(10,2);
  END IF;
END $$;

-- 12. Full Transaction Schema Assurance
DO $$ 
BEGIN
  -- We assume public.transactions exists. Let's add any missing frontend columns:
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transactions' AND column_name='station_name') THEN
    ALTER TABLE public.transactions ADD COLUMN station_name VARCHAR(255);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transactions' AND column_name='plate_number') THEN
    ALTER TABLE public.transactions ADD COLUMN plate_number VARCHAR(50);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transactions' AND column_name='fuel_type_id') THEN
    ALTER TABLE public.transactions ADD COLUMN fuel_type_id UUID REFERENCES public.fuel_types(id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transactions' AND column_name='fuel_type_name') THEN
    ALTER TABLE public.transactions ADD COLUMN fuel_type_name VARCHAR(100);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transactions' AND column_name='liters') THEN
    ALTER TABLE public.transactions ADD COLUMN liters DECIMAL(10,2);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transactions' AND column_name='total_price') THEN
    ALTER TABLE public.transactions ADD COLUMN total_price DECIMAL(15,2);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transactions' AND column_name='payment_method') THEN
    ALTER TABLE public.transactions ADD COLUMN payment_method VARCHAR(50);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transactions' AND column_name='date') THEN
    ALTER TABLE public.transactions ADD COLUMN date DATE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transactions' AND column_name='time') THEN
    ALTER TABLE public.transactions ADD COLUMN time TIME;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transactions' AND column_name='status') THEN
    ALTER TABLE public.transactions ADD COLUMN status VARCHAR(50);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transactions' AND column_name='queue_number') THEN
    ALTER TABLE public.transactions ADD COLUMN queue_number INTEGER;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transactions' AND column_name='payment_qr_code') THEN
    ALTER TABLE public.transactions ADD COLUMN payment_qr_code TEXT;
  END IF;
END $$;

-- 13. Queue Sessions Schema Assurance
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='queue_sessions') THEN
    CREATE TABLE public.queue_sessions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='queue_sessions' AND column_name='transaction_id') THEN
    ALTER TABLE public.queue_sessions ADD COLUMN transaction_id UUID REFERENCES public.transactions(id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='queue_sessions' AND column_name='station_id') THEN
    ALTER TABLE public.queue_sessions ADD COLUMN station_id UUID REFERENCES public.stations(id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='queue_sessions' AND column_name='status') THEN
    ALTER TABLE public.queue_sessions ADD COLUMN status VARCHAR(50) DEFAULT 'waiting';
  END IF;
END $$;
