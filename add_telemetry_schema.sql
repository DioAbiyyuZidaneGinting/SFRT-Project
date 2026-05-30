-- =========================================================================
-- DATABASE SCHEMA MIGRATION: ADVANCED REALTIME TELEMETRY & VIEW AGGREGATIONS
-- Execute this script in your Supabase SQL Editor
-- =========================================================================

-- 0. Normalize and Harden Table Check Constraints to Lowercase Status Values
UPDATE public.transactions SET status = LOWER(TRIM(status));
UPDATE public.queue_sessions SET status = LOWER(TRIM(status));

ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_status_check;
ALTER TABLE public.transactions ADD CONSTRAINT transactions_status_check CHECK (status IN ('pending', 'paying', 'queued', 'refueling', 'completed', 'cancelled', 'failed'));

ALTER TABLE public.queue_sessions DROP CONSTRAINT IF EXISTS queue_sessions_status_check;
ALTER TABLE public.queue_sessions ADD CONSTRAINT queue_sessions_status_check CHECK (status IN ('waiting', 'refueling', 'completed', 'cancelled', 'failed'));

-- 0.1 Convert queue_number columns to INTEGER on transactions and queue_sessions
-- Clean up existing values by converting 'Q-123' to '123', 'pending' to random int
UPDATE public.transactions
SET queue_number = CASE 
  WHEN queue_number ~ '^[0-9]+$' THEN queue_number
  WHEN queue_number ~ '^Q-[0-9]+$' THEN regexp_replace(queue_number, '^Q-', '')
  ELSE (floor(100 + random() * 899))::text
END;

ALTER TABLE public.transactions 
  ALTER COLUMN queue_number TYPE INTEGER USING queue_number::INTEGER;

-- For queue_sessions, ensure column is INTEGER
-- Check if column exists first; if not, create it
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='queue_sessions' AND column_name='queue_number') THEN
    ALTER TABLE public.queue_sessions ADD COLUMN queue_number INTEGER;
  ELSE
    -- If it exists, clean up and cast
    UPDATE public.queue_sessions
    SET queue_number = CASE 
      WHEN queue_number::text ~ '^[0-9]+$' THEN queue_number::text
      WHEN queue_number::text ~ '^Q-[0-9]+$' THEN regexp_replace(queue_number::text, '^Q-', '')
      ELSE (floor(100 + random() * 899))::text
    END::integer;
    
    ALTER TABLE public.queue_sessions 
      ALTER COLUMN queue_number TYPE INTEGER USING queue_number::INTEGER;
  END IF;
END $$;

-- 1. Create Telemetry Logs Table
CREATE TABLE IF NOT EXISTS public.telemetry_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID REFERENCES public.iot_devices(id) ON DELETE CASCADE,
  event_type VARCHAR(100) NOT NULL,
  severity VARCHAR(50) NOT NULL, -- 'info', 'warning', 'critical'
  message TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create System Alerts Table
CREATE TABLE IF NOT EXISTS public.system_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  severity VARCHAR(50) NOT NULL, -- 'info', 'warning', 'critical'
  status VARCHAR(50) DEFAULT 'active', -- 'active', 'acknowledged', 'resolved'
  resolved_by UUID REFERENCES public.users(id),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Enhance Transactions Table (Ensure Columns Exist)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transactions' AND column_name='updated_at') THEN
    ALTER TABLE public.transactions ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transactions' AND column_name='compatibility_score') THEN
    ALTER TABLE public.transactions ADD COLUMN compatibility_score INT DEFAULT 100;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transactions' AND column_name='payment_method') THEN
    ALTER TABLE public.transactions ADD COLUMN payment_method VARCHAR(50) DEFAULT 'cash';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transactions' AND column_name='queue_session_id') THEN
    ALTER TABLE public.transactions ADD COLUMN queue_session_id UUID;
  END IF;
END $$;

-- 4. Enhance Queue Sessions Table (Ensure Columns Exist)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='queue_sessions' AND column_name='updated_at') THEN
    ALTER TABLE public.queue_sessions ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='queue_sessions' AND column_name='user_id') THEN
    ALTER TABLE public.queue_sessions ADD COLUMN user_id UUID REFERENCES public.users(id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='queue_sessions' AND column_name='lane_number') THEN
    ALTER TABLE public.queue_sessions ADD COLUMN lane_number INT DEFAULT 1;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='queue_sessions' AND column_name='started_at') THEN
    ALTER TABLE public.queue_sessions ADD COLUMN started_at TIMESTAMPTZ;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='queue_sessions' AND column_name='completed_at') THEN
    ALTER TABLE public.queue_sessions ADD COLUMN completed_at TIMESTAMPTZ;
  END IF;
END $$;

-- 5. Create Performance-boosting Database Indexes
CREATE INDEX IF NOT EXISTS idx_transactions_created_at_status ON public.transactions (created_at DESC, status);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions (user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_fuel_type ON public.transactions (fuel_type_name);
CREATE INDEX IF NOT EXISTS idx_queue_sessions_status_station ON public.queue_sessions (status, station_id);
CREATE INDEX IF NOT EXISTS idx_queue_sessions_created_at ON public.queue_sessions (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_telemetry_logs_device_created ON public.telemetry_logs (device_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_alerts_status_severity ON public.system_alerts (status, severity);

-- 6. Setup Automated updated_at Trigger Function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to transactions
DROP TRIGGER IF EXISTS trg_update_transactions_updated_at ON public.transactions;
CREATE TRIGGER trg_update_transactions_updated_at
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Apply updated_at trigger to queue_sessions
DROP TRIGGER IF EXISTS trg_update_queue_sessions_updated_at ON public.queue_sessions;
CREATE TRIGGER trg_update_queue_sessions_updated_at
  BEFORE UPDATE ON public.queue_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Apply updated_at trigger to iot_devices
DROP TRIGGER IF EXISTS trg_update_iot_devices_updated_at ON public.iot_devices;
CREATE TRIGGER trg_update_iot_devices_updated_at
  BEFORE UPDATE ON public.iot_devices
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();


-- =========================================================================
-- AUTOMATED LIFECYCLE SYNCHRONIZATION TRIGGERS
-- =========================================================================

-- Trigger to progress queue sessions from transaction events
CREATE OR REPLACE FUNCTION public.sync_transaction_queue_lifecycle()
RETURNS TRIGGER AS $$
DECLARE
  new_queue_id UUID;
  assigned_lane INT;
  status_changed BOOLEAN;
  temp_queue_num INT;
BEGIN
  IF pg_trigger_depth() > 1 THEN
    RETURN NEW;
  END IF;

  -- Normalize status input to lowercase
  NEW.status := LOWER(TRIM(NEW.status));

  -- Determine if the status has changed
  IF TG_OP = 'INSERT' THEN
    status_changed := TRUE;
  ELSE
    status_changed := (OLD.status IS DISTINCT FROM NEW.status);
  END IF;

  -- 1. Status progression enforcement (on UPDATE)
  IF TG_OP = 'UPDATE' AND status_changed THEN
    IF OLD.status = 'pending' AND NEW.status NOT IN ('paying', 'queued', 'cancelled', 'failed') THEN
      RAISE EXCEPTION 'Invalid transaction status transition from % to %', OLD.status, NEW.status;
    ELSIF OLD.status = 'paying' AND NEW.status NOT IN ('queued', 'cancelled', 'failed') THEN
      RAISE EXCEPTION 'Invalid transaction status transition from % to %', OLD.status, NEW.status;
    ELSIF OLD.status = 'queued' AND NEW.status NOT IN ('refueling', 'cancelled', 'failed') THEN
      RAISE EXCEPTION 'Invalid transaction status transition from % to %', OLD.status, NEW.status;
    ELSIF OLD.status = 'refueling' AND NEW.status NOT IN ('completed', 'failed') THEN
      RAISE EXCEPTION 'Invalid transaction status transition from % to %', OLD.status, NEW.status;
    ELSIF OLD.status IN ('completed', 'cancelled', 'failed') THEN
      RAISE EXCEPTION 'Cannot update transaction status from terminal state %', OLD.status;
    END IF;
  END IF;

  -- Only act if status is changed/set
  IF status_changed THEN
    -- 1. When transaction transitions to 'queued'
    IF NEW.status = 'queued' THEN
      -- Pick a lane dynamically (alternate or select least busy)
      IF (SELECT COUNT(*) FROM public.queue_sessions WHERE status IN ('waiting', 'refueling') AND lane_number = 1) >
         (SELECT COUNT(*) FROM public.queue_sessions WHERE status IN ('waiting', 'refueling') AND lane_number = 2) THEN
        assigned_lane := 2;
      ELSE
        assigned_lane := 1;
      END IF;

      -- Create queue session if not already existing for this transaction
      IF NOT EXISTS (SELECT 1 FROM public.queue_sessions WHERE transaction_id = NEW.id) THEN
        temp_queue_num := COALESCE(NEW.queue_number, floor(100 + random() * 899)::integer);
        
        INSERT INTO public.queue_sessions (
          id,
          transaction_id,
          user_id,
          station_id,
          status,
          lane_number,
          queue_number,
          created_at
        ) VALUES (
          gen_random_uuid(),
          NEW.id,
          NEW.user_id,
          NEW.station_id,
          'waiting',
          assigned_lane,
          temp_queue_num,
          NOW()
        ) RETURNING id INTO new_queue_id;

        NEW.queue_session_id := new_queue_id;
        NEW.queue_number := temp_queue_num; -- Sync back to transaction
      END IF;

      -- Resolve existing session id if needed
      IF NEW.queue_session_id IS NULL THEN
        SELECT id, queue_number INTO NEW.queue_session_id, NEW.queue_number 
        FROM public.queue_sessions WHERE transaction_id = NEW.id;
      END IF;

      -- Hard atomicity check: if queue session is still missing, roll back!
      IF NEW.queue_session_id IS NULL THEN
        RAISE EXCEPTION 'Atomic queue session resolution failed for transaction %', NEW.id;
      END IF;
    END IF;

    -- 2. When transaction transitions to 'refueling'
    IF NEW.status = 'refueling' THEN
      IF NEW.queue_session_id IS NOT NULL THEN
        UPDATE public.queue_sessions
        SET status = 'refueling', started_at = NOW()
        WHERE id = NEW.queue_session_id;
      ELSE
        -- Fallback: update by transaction_id
        UPDATE public.queue_sessions
        SET status = 'refueling', started_at = NOW()
        WHERE transaction_id = NEW.id;
      END IF;
    END IF;

    -- 3. When transaction transitions to 'completed'
    IF NEW.status = 'completed' THEN
      IF NEW.queue_session_id IS NOT NULL THEN
        UPDATE public.queue_sessions
        SET status = 'completed', completed_at = NOW()
        WHERE id = NEW.queue_session_id;
      ELSE
        UPDATE public.queue_sessions
        SET status = 'completed', completed_at = NOW()
        WHERE transaction_id = NEW.id;
      END IF;
    END IF;

    -- 4. When transaction transitions to 'cancelled'
    IF NEW.status = 'cancelled' THEN
      IF NEW.queue_session_id IS NOT NULL THEN
        UPDATE public.queue_sessions
        SET status = 'cancelled', completed_at = NOW()
        WHERE id = NEW.queue_session_id;
      ELSE
        UPDATE public.queue_sessions
        SET status = 'cancelled', completed_at = NOW()
        WHERE transaction_id = NEW.id;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to sync matching transaction status when queue session changes
CREATE OR REPLACE FUNCTION public.sync_queue_session_transaction_lifecycle()
RETURNS TRIGGER AS $$
DECLARE
  status_changed BOOLEAN;
BEGIN
  IF pg_trigger_depth() > 1 THEN
    RETURN NEW;
  END IF;

  -- Normalize status input to lowercase
  NEW.status := LOWER(TRIM(NEW.status));

  -- Determine if status changed
  IF TG_OP = 'INSERT' THEN
    status_changed := TRUE;
  ELSE
    status_changed := (OLD.status IS DISTINCT FROM NEW.status);
  END IF;

  -- 1. Status progression enforcement (on UPDATE)
  IF TG_OP = 'UPDATE' AND status_changed THEN
    IF OLD.status = 'waiting' AND NEW.status NOT IN ('refueling', 'cancelled', 'failed') THEN
      RAISE EXCEPTION 'Invalid queue session status transition from % to %', OLD.status, NEW.status;
    ELSIF OLD.status = 'refueling' AND NEW.status NOT IN ('completed', 'failed') THEN
      RAISE EXCEPTION 'Invalid queue session status transition from % to %', OLD.status, NEW.status;
    ELSIF OLD.status IN ('completed', 'cancelled', 'failed') THEN
      RAISE EXCEPTION 'Cannot update queue session status from terminal state %', OLD.status;
    END IF;
  END IF;

  -- If status transitions
  IF status_changed THEN
    -- Sync linked transaction status
    UPDATE public.transactions
    SET status = NEW.status
    WHERE queue_session_id = NEW.id;
    
    -- Sync by transaction_id fallback
    UPDATE public.transactions
    SET status = NEW.status, queue_session_id = NEW.id
    WHERE id = NEW.transaction_id AND (queue_session_id IS NULL OR queue_session_id <> NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Register transaction sync triggers
DROP TRIGGER IF EXISTS trg_sync_transaction_queue_lifecycle ON public.transactions;
CREATE TRIGGER trg_sync_transaction_queue_lifecycle
  BEFORE INSERT OR UPDATE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_transaction_queue_lifecycle();

-- Register queue session sync triggers
DROP TRIGGER IF EXISTS trg_sync_queue_session_transaction_lifecycle ON public.queue_sessions;
CREATE TRIGGER trg_sync_queue_session_transaction_lifecycle
  BEFORE INSERT OR UPDATE ON public.queue_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_queue_session_transaction_lifecycle();


-- =========================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES FOR OPERATIONS & TELEMETRY
-- =========================================================================

-- Enable RLS
ALTER TABLE public.telemetry_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_alerts ENABLE ROW LEVEL SECURITY;

-- Helper security functions for role validation
CREATE OR REPLACE FUNCTION public.is_admin_or_operator(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = user_uuid AND (role = 'admin' OR role = 'operator')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Telemetry Logs Security
DROP POLICY IF EXISTS "Admins and Operators can read/write telemetry logs" ON public.telemetry_logs;
CREATE POLICY "Admins and Operators can read/write telemetry logs" 
  ON public.telemetry_logs 
  FOR ALL
  USING (public.is_admin_or_operator(auth.uid()))
  WITH CHECK (public.is_admin_or_operator(auth.uid()));

-- System Alerts Security
DROP POLICY IF EXISTS "Admins and Operators can view and update system alerts" ON public.system_alerts;
CREATE POLICY "Admins and Operators can view and update system alerts" 
  ON public.system_alerts 
  FOR ALL
  USING (public.is_admin_or_operator(auth.uid()))
  WITH CHECK (public.is_admin_or_operator(auth.uid()));

-- View Permission Security policy (Allows select of views to admins)
-- (PostgreSQL automatically applies RLS of underlying tables if views use security invoker,
-- but we make sure policies on underlying tables grant access).
-- Let's adjust existing Transactions / Queue Sessions RLS policies to allow Admins.
DROP POLICY IF EXISTS "Admins can view all transactions" ON public.transactions;
CREATE POLICY "Admins can view all transactions" 
  ON public.transactions 
  FOR SELECT 
  USING (public.is_admin_or_operator(auth.uid()) OR auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can update transactions" ON public.transactions;
DROP POLICY IF EXISTS "Admins and owners can update transactions" ON public.transactions;
CREATE POLICY "Admins and owners can update transactions" 
  ON public.transactions 
  FOR UPDATE 
  USING (public.is_admin_or_operator(auth.uid()) OR auth.uid() = user_id)
  WITH CHECK (public.is_admin_or_operator(auth.uid()) OR auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all queue sessions" ON public.queue_sessions;
CREATE POLICY "Admins can view all queue sessions" 
  ON public.queue_sessions 
  FOR SELECT 
  USING (public.is_admin_or_operator(auth.uid()) OR auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admins can update queue sessions" ON public.queue_sessions;
CREATE POLICY "Admins can update queue sessions" 
  ON public.queue_sessions 
  FOR UPDATE 
  USING (public.is_admin_or_operator(auth.uid()))
  WITH CHECK (public.is_admin_or_operator(auth.uid()));


-- =========================================================================
-- DATABASE AGGREGATED VIEWS (REAL-TIME ENGINE)
-- =========================================================================

-- View 1: Dashboard Metrics
CREATE OR REPLACE VIEW public.dashboard_metrics_view AS
SELECT
  (SELECT COALESCE(SUM(total_price), 0) FROM public.transactions WHERE status = 'completed' AND created_at::date = CURRENT_DATE) AS revenue_today,
  (SELECT COALESCE(SUM(liters), 0) FROM public.transactions WHERE status = 'completed' AND created_at::date = CURRENT_DATE) AS fuel_dispensed_today,
  (SELECT COUNT(*)::int FROM public.queue_sessions WHERE status IN ('waiting', 'refueling')) AS active_lanes_count,
  (SELECT COUNT(*)::int FROM public.iot_devices WHERE status IN ('offline', 'error')) AS offline_devices_count;

-- View 2: Hourly Revenue & Counts (last 30 days)
CREATE OR REPLACE VIEW public.analytics_hourly_view AS
SELECT
  to_char(created_at, 'HH24:00') AS hour_bucket,
  COUNT(id)::int AS transaction_count,
  COALESCE(SUM(total_price), 0) AS total_revenue
FROM public.transactions
WHERE status = 'completed' AND created_at >= NOW() - INTERVAL '30 days'
GROUP BY hour_bucket
ORDER BY hour_bucket;

-- View 3: Fuel Type Market Share
CREATE OR REPLACE VIEW public.analytics_fuel_share_view AS
SELECT
  COALESCE(fuel_type_name, 'Unknown') AS fuel_type,
  COUNT(id)::int AS transaction_count,
  COALESCE(SUM(liters), 0) AS total_liters
FROM public.transactions
WHERE status = 'completed'
GROUP BY fuel_type_name
ORDER BY transaction_count DESC;

-- View 4: Average Queue Wait Duration per Station
CREATE OR REPLACE VIEW public.analytics_queue_view AS
SELECT
  s.name AS station_name,
  COALESCE(AVG(EXTRACT(EPOCH FROM (q.completed_at - q.started_at)) / 60.0), 0) AS avg_wait_minutes,
  COALESCE(MAX(EXTRACT(EPOCH FROM (q.completed_at - q.started_at)) / 60.0), 0) AS peak_wait_minutes
FROM public.queue_sessions q
JOIN public.stations s ON q.station_id = s.id
WHERE q.status = 'completed' AND q.started_at IS NOT NULL AND q.completed_at IS NOT NULL
GROUP BY s.name;

-- View 5: User Registration Cumulative Growth
CREATE OR REPLACE VIEW public.analytics_user_growth_view AS
WITH monthly_regs AS (
  SELECT
    to_char(created_at, 'YYYY-MM') AS reg_month,
    to_char(created_at, 'Mon') AS reg_month_short,
    COUNT(id) AS registrations
  FROM public.users
  GROUP BY reg_month, reg_month_short
)
SELECT
  reg_month,
  reg_month_short,
  SUM(registrations) OVER (ORDER BY reg_month)::int AS cumulative_drivers
FROM monthly_regs
ORDER BY reg_month;
