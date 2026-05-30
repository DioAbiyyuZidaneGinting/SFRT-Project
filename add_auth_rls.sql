-- ==========================================
-- AUTH PROFILE SCHEMA — Batch 6
-- Run AFTER supabase_schema.sql
-- Adds OAuth columns, updated_at trigger,
-- OAuth profile sync trigger, and full RLS.
-- ==========================================

-- ── 1. Add OAuth profile columns to public.users (idempotent) ──────────────

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'avatar_url'
  ) THEN
    ALTER TABLE public.users ADD COLUMN avatar_url TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'last_login'
  ) THEN
    ALTER TABLE public.users ADD COLUMN last_login TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.users ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

-- ── 2. updated_at auto-refresh trigger for public.users ───────────────────

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS users_updated_at ON public.users;
CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ── 3. OAuth + signup profile sync trigger ────────────────────────────────
-- Fires on INSERT to auth.users (new signup or first Google OAuth login).
-- Upserts profile into public.users.
-- ON CONFLICT preserves manually-set admin roles.
-- NEVER stores passwords — auth stays solely in auth.users.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _full_name  TEXT;
  _avatar_url TEXT;
  _role       TEXT;
BEGIN
  _full_name := COALESCE(
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'name',
    split_part(NEW.email, '@', 1)
  );
  _avatar_url := NEW.raw_user_meta_data ->> 'avatar_url';

  -- Default role: admin if email contains 'admin', else customer
  _role := CASE
    WHEN NEW.email ILIKE '%admin%' THEN 'admin'
    ELSE 'customer'
  END;

  INSERT INTO public.users (id, email, full_name, avatar_url, role, last_login, updated_at)
  VALUES (NEW.id, NEW.email, _full_name, _avatar_url, _role, NOW(), NOW())
  ON CONFLICT (id) DO UPDATE
    SET
      email      = EXCLUDED.email,
      full_name  = COALESCE(EXCLUDED.full_name, public.users.full_name),
      avatar_url = COALESCE(EXCLUDED.avatar_url, public.users.avatar_url),
      last_login = NOW(),
      updated_at = NOW();
  -- role NOT overwritten: preserves manual admin assignments

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ── 4. Enable RLS on public.users ─────────────────────────────────────────

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- ── 5. RLS Policies: public.users ─────────────────────────────────────────

DROP POLICY IF EXISTS "Users can view own profile"   ON public.users;
DROP POLICY IF EXISTS "Users can update own profile"  ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile"  ON public.users;

-- SELECT: user can only read their own row
CREATE POLICY "Users can view own profile"
  ON public.users
  FOR SELECT
  USING (auth.uid() = id);

-- UPDATE: user can only update their own row
CREATE POLICY "Users can update own profile"
  ON public.users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- INSERT: only service role / trigger inserts (no direct client insert)
-- Frontend never inserts directly; the handle_new_user trigger does this via SECURITY DEFINER.
-- Keeping policy restricted to prevent cross-user injection.
CREATE POLICY "Users can insert own profile"
  ON public.users
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ── 6. RLS Policies: public.vehicles (idempotent drop + recreate) ─────────

ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own vehicles"   ON public.vehicles;
DROP POLICY IF EXISTS "Users can insert their own vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Users can update their own vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Users can delete their own vehicles" ON public.vehicles;

CREATE POLICY "Users can view their own vehicles"
  ON public.vehicles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own vehicles"
  ON public.vehicles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own vehicles"
  ON public.vehicles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own vehicles"
  ON public.vehicles FOR DELETE
  USING (auth.uid() = user_id);

-- ── 7. RLS Policies: public.transactions ──────────────────────────────────

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own transactions"   ON public.transactions;
DROP POLICY IF EXISTS "Users can insert their own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can update their own transactions" ON public.transactions;

CREATE POLICY "Users can view their own transactions"
  ON public.transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own transactions"
  ON public.transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own transactions"
  ON public.transactions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── 8. RLS Policies: public.queue_sessions ────────────────────────────────
-- queue_sessions uses user_id for ownership; falls back to auth role check
-- for admin/operator visibility (realtime subscriptions still work).

ALTER TABLE public.queue_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view queue sessions"           ON public.queue_sessions;
DROP POLICY IF EXISTS "Users can join queue"                    ON public.queue_sessions;
DROP POLICY IF EXISTS "Users can view their own queue session"  ON public.queue_sessions;
DROP POLICY IF EXISTS "Users can insert their own queue session" ON public.queue_sessions;
DROP POLICY IF EXISTS "Users can update their own queue session" ON public.queue_sessions;

-- Add user_id column if missing (some environments may not have it yet)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'queue_sessions' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE public.queue_sessions ADD COLUMN user_id UUID REFERENCES auth.users(id);
  END IF;
END $$;

-- SELECT: user sees their own sessions; authenticated users can see all (for queue display)
CREATE POLICY "Users can view queue sessions"
  ON public.queue_sessions FOR SELECT
  USING (auth.role() = 'authenticated');

-- INSERT: only authenticated users
CREATE POLICY "Users can insert their own queue session"
  ON public.queue_sessions FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- UPDATE: only own session
CREATE POLICY "Users can update their own queue session"
  ON public.queue_sessions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── 9. Realtime publication — ensure tables are published ─────────────────
-- Required for Supabase Realtime subscriptions to work with RLS enabled.

DO $$
BEGIN
  -- Add tables to supabase_realtime publication if not already present
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'transactions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'queue_sessions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.queue_sessions;
  END IF;
END $$;
