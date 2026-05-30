import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { AuthService } from '../../services/authService';
import { useAuthStore } from '../../lib/authStore';

export function AuthCallback() {
  const [status, setStatus] = useState<'processing' | 'error'>('processing');
  const [errorMsg, setErrorMsg] = useState('');
  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    // ── Define finalizeLogin FIRST (before call/reference) to avoid any hoisting issues ──
    async function finalizeLogin(supaUser: any) {
      console.log('[Callback] Starting finalizeLogin for uid:', supaUser.id, 'email:', supaUser.email);

      const email = supaUser.email || '';
      const fullName =
        supaUser.user_metadata?.full_name ||
        supaUser.user_metadata?.name ||
        email.split('@')[0].toUpperCase();
      const avatarUrl = supaUser.user_metadata?.avatar_url || '';

      // ── Fire-and-forget background sync: never blocks UI/redirection ──
      console.log('[Callback] Triggering profile sync in background...');
      AuthService.syncOAuthProfile(supaUser.id, email, fullName, avatarUrl)
        .then(() => console.log('[Callback] OAuth profile synced (background)'))
        .catch((err: any) => console.warn('[Callback] sync warning (non-fatal):', err?.message));

      // ── Fetch user profile/role from DB with a 2-second timeout ──
      console.log('[Callback] Fetching DB profile (timeout: 2s)...');
      let dbUser: any = null;
      try {
        const fetchPromise = AuthService.getSessionUser();
        const timeoutPromise = new Promise<null>((resolve) =>
          setTimeout(() => {
            console.warn('[Callback] DB profile fetch timed out — using metadata fallback');
            resolve(null);
          }, 2000)
        );
        dbUser = await Promise.race([fetchPromise, timeoutPromise]);
      } catch (err: any) {
        console.warn('[Callback] DB profile fetch failed:', err.message);
      }

      // ── Build user model (priority: DB role > metadata role) ──
      const role = dbUser?.role || (email.toLowerCase().includes('admin') ? 'admin' : 'customer');
      const user = {
        id: supaUser.id,
        email,
        fullName: dbUser?.fullName || fullName,
        role
      } as any;

      // Save persistent logs to localStorage to survive page refresh
      const logs = JSON.parse(localStorage.getItem('auth_callback_logs') || '[]');
      logs.push(`[Callback] DB profile fetched: ${JSON.stringify(dbUser)}`);
      logs.push(`[Callback] Calculated role: ${role}`);
      logs.push(`[Callback] Hydrating auth store. Redirecting to: ${role === 'admin' || role === 'operator' ? '/admin' : '/'}`);
      localStorage.setItem('auth_callback_logs', JSON.stringify(logs));

      console.log('[Callback] Hydrating auth store. Redirecting to:', role === 'admin' || role === 'operator' ? '/admin' : '/');
      useAuthStore.setState({ user, isAuthenticated: true, isLoading: false });

      // ── Hard redirect to bypass React Router URL hash conflict ──
      window.location.href = role === 'admin' || role === 'operator' ? '/admin' : '/';
    }

    async function handleCallback() {
      try {
        localStorage.setItem('auth_callback_logs', JSON.stringify([`[Callback] Starting callback processing...`]));
        // ── Step 1: Check for existing session first (do NOT clean URL yet so Supabase can read it) ──
        const { data: existingData } = await supabase.auth.getSession();
        
        const logs = JSON.parse(localStorage.getItem('auth_callback_logs') || '[]');
        logs.push(`[Callback] Existing session detected: ${!!existingData.session}`);
        localStorage.setItem('auth_callback_logs', JSON.stringify(logs));

        console.log('[Callback] Existing session:', existingData.session);

        if (existingData.session?.user) {
          // Clean URL now that session is successfully detected/loaded
          window.history.replaceState({}, '', '/auth/callback');
          await finalizeLogin(existingData.session.user);
          return;
        }

        // ── Step 2: Only exchange if code= param is present ──
        const hasCode = window.location.search.includes('code=');
        console.log('[Callback] Has code param:', hasCode, '| search:', window.location.search);

        if (!hasCode) {
          throw new Error('No authentication code found. Please try signing in again.');
        }

        console.log('[Callback] Exchanging code for session...');
        const { data, error } = await supabase.auth.exchangeCodeForSession(
          window.location.href
        );
        console.log('[Callback] Exchange result — session:', data?.session?.user?.id, '| error:', error);

        if (error || !data.session?.user) {
          throw new Error(error?.message || 'Authentication failed. Please try again.');
        }

        // Clean code/params from URL after successful exchange
        window.history.replaceState({}, '', '/auth/callback');

        await finalizeLogin(data.session.user);

      } catch (err: any) {
        console.error('[Callback] Fatal error:', err.message);
        setErrorMsg(err.message);
        setStatus('error');
        setTimeout(() => { window.location.href = '/auth'; }, 3000);
      }
    }

    handleCallback();
  }, []);

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center gap-6 p-6 font-sans text-text-primary" id="auth-callback-module">
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand-emerald/5 via-transparent to-transparent pointer-events-none" />
      <div className="relative z-10 flex flex-col items-center gap-6 max-w-sm w-full text-center">
        <div className="flex items-center gap-2 mb-2">
          <span className="w-2.5 h-2.5 bg-brand-emerald rounded-full animate-pulse" />
          <span className="font-display font-semibold tracking-wider text-text-primary text-lg">SFRT</span>
        </div>

        {status === 'processing' ? (
          <>
            <div className="relative w-14 h-14">
              <div className="absolute inset-0 rounded-full border-2 border-brand-emerald/10" />
              <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-brand-emerald animate-spin" />
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-sm">Authenticating Driver Identity</p>
              <p className="text-xs text-text-secondary">Syncing details...</p>
            </div>
          </>
        ) : (
          <>
            <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <div className="space-y-2">
              <p className="font-semibold text-red-500">Authentication Failed</p>
              <p className="text-xs text-text-secondary">{errorMsg}</p>
              <p className="text-[10px] text-text-secondary/70">Redirecting back to login...</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
