-- =========================================================================
-- TRANSACTIONAL EMAIL SYSTEM MIGRATION
-- Adds the public.email_logs auditing table, a secure webhook trigger function,
-- and links it asynchronously to Supabase Edge Functions using pg_net.
-- =========================================================================

-- Enable pg_net extension if not already enabled (essential for async webhooks)
CREATE EXTENSION IF NOT EXISTS pg_net SCHEMA extensions;

-- ── 1. Create Email Logs Auditing Table ──────────────────────────────────
CREATE TABLE IF NOT EXISTS public.email_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    recipient_email VARCHAR(255) NOT NULL,
    email_type VARCHAR(50) NOT NULL DEFAULT 'receipt',
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'sent', 'failed'
    attempts INT DEFAULT 1,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on public.email_logs for enterprise-grade security
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to prevent conflict errors if re-run
DROP POLICY IF EXISTS "Users can view their own email logs" ON public.email_logs;

-- Users can only view their own email logs
CREATE POLICY "Users can view their own email logs" 
  ON public.email_logs FOR SELECT 
  USING (auth.uid() = user_id);

-- ── 2. Create the Transaction Completed Trigger Function ──────────────────
CREATE OR REPLACE FUNCTION public.trig_transaction_completed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, net
AS $$
DECLARE
    _webhook_url TEXT;
    _webhook_secret TEXT;
    _payload JSONB;
BEGIN
    -- CRITICAL PROTECTION: Check if status changed to 'completed' and was NOT 'completed' before.
    -- Prevents duplicate email blasts if the row gets updated for other reasons later.
    IF (
      NEW.status = 'completed'
      AND (
        TG_OP = 'INSERT'
        OR OLD.status IS DISTINCT FROM 'completed'
      )
    ) THEN
        
        -- Default Edge Function URL for Supabase local development / production.
        -- In production, Supabase automatically routes Edge Functions securely.
        _webhook_url := 'https://gjsrlewvykcoltanklxg.supabase.co/functions/v1/send-transaction-email';
        
        -- Custom webhook signature for authentication check inside the Deno Edge Function.
        -- This ensures only the database can invoke the Edge Function endpoint.
        _webhook_secret := 'SFRT_DB_WEBHOOK_SECURE_TOKEN_2026';

        -- Build transaction payload (minimal, clean, security-audit-safe)
        _payload := jsonb_build_object(
            'event_type', 'receipt',
            'transaction_id', NEW.id,
            'user_id', NEW.user_id,
            'station_name', COALESCE(NEW.station_name, 'SFRT - Central Hub'),
            'plate_number', NEW.plate_number,
            'fuel_type_name', NEW.fuel_type_name,
            'liters', NEW.liters,
            'price_per_liter', NEW.price_per_liter,
            'total_price', NEW.total_price,
            'payment_method', NEW.payment_method,
            'date', NEW.date,
            'time', NEW.time
        );

        -- Initialize email audit log as 'pending'
        INSERT INTO public.email_logs (transaction_id, user_id, recipient_email, email_type, status)
        VALUES (
            NEW.id, 
            NEW.user_id, 
            (SELECT email FROM auth.users WHERE id = NEW.user_id LIMIT 1), 
            'receipt', 
            'pending'
        );

        -- Async POST call using pg_net (returns immediately, completely non-blocking)
        PERFORM net.http_post(
            url := 'https://gjsrlewvykcoltanklxg.supabase.co/functions/v1/send-transaction-email',
            headers := jsonb_build_object(
                'Content-Type', 'application/json',
                'x-webhook-secret', 'SFRT_DB_WEBHOOK_SECURE_TOKEN_2026'
            ),
            body := jsonb_build_object(
                'transaction_id', NEW.id
            )
        );

    END IF;

    RETURN NEW;
END;
$$;

-- ── 3. Bind Trigger to public.transactions Table ─────────────────────────
DROP TRIGGER IF EXISTS on_transaction_completed ON public.transactions;
CREATE TRIGGER on_transaction_completed
    AFTER INSERT OR UPDATE ON public.transactions
    FOR EACH ROW
    EXECUTE FUNCTION public.trig_transaction_completed();
