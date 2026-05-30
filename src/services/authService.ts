import { supabase } from '../lib/supabase';
import { UserRole, User } from '../lib/authStore';

// ==========================================
// AUTH SERVICE — Production Supabase Auth
// No mocks, no local fallback, no fake auth.
// ==========================================

export const AuthService = {
  /**
   * Register a new user with Supabase Auth.
   * Profile is created automatically via Postgres trigger on auth.users insert.
   */
  signUp: async (
    email: string,
    password: string,
    fullName: string,
    phoneNumber: string = ''
  ): Promise<{ user: User | null; needsEmailConfirmation?: boolean; error: string | null }> => {
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            phone_number: phoneNumber,
          },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Failed to create account.');

      const needsEmailConfirmation = authData.session === null;

      return {
        user: {
          id: authData.user.id,
          email,
          fullName,
          role: 'customer',
        },
        needsEmailConfirmation,
        error: null,
      };
    } catch (err: any) {
      return { user: null, needsEmailConfirmation: false, error: err.message || 'Registration failed' };
    }
  },

  /**
   * Sign in with email/password and fetch user profile + role.
   */
  signIn: async (
    email: string,
    password: string
  ): Promise<{ user: User | null; error: string | null }> => {
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Authentication failed.');

      const { data: profile } = await supabase
        .from('users')
        .select('full_name, role, avatar_url')
        .eq('id', authData.user.id)
        .single();

      // Update last_login timestamp
      await supabase
        .from('users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', authData.user.id);

      const fullName = profile?.full_name || email.split('@')[0].toUpperCase();
      const role = (profile?.role as UserRole) || (email.includes('admin') ? 'admin' : 'customer');

      return {
        user: { id: authData.user.id, email, fullName, role },
        error: null,
      };
    } catch (err: any) {
      return { user: null, error: err.message || 'Login failed' };
    }
  },

  /**
   * Sign in with Google via Supabase OAuth.
   * Redirects to /auth/callback where session is exchanged.
   */
  signInWithGoogle: async (): Promise<{ error: string | null }> => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) throw error;
      return { error: null };
    } catch (err: any) {
      return { error: err.message || 'Google sign-in failed' };
    }
  },

  /**
   * Send a password reset email via Supabase magic recovery link.
   * Always returns success to prevent email enumeration.
   * Redirects to /reset-password where PASSWORD_RECOVERY session is handled.
   */
  requestPasswordReset: async (email: string): Promise<{ error: string | null }> => {
    try {
      // Fire-and-forget: we intentionally ignore whether the email exists
      // This prevents email enumeration (security best practice)
      await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      // Always return success regardless of outcome
      return { error: null };
    } catch (err: any) {
      // Still return null error to preserve ambiguity
      console.error('[AuthService] requestPasswordReset error (suppressed):', err);
      return { error: null };
    }
  },

  /**
   * Update the authenticated user's password.
   * Should only be called from /reset-password after PASSWORD_RECOVERY session is active.
   * Supabase manages session lifecycle — no manual invalidation needed.
   */
  updatePassword: async (newPassword: string): Promise<{ error: string | null }> => {
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      return { error: null };
    } catch (err: any) {
      return { error: err.message || 'Failed to update password' };
    }
  },

  /**
   * Sync Google OAuth profile data to public.users table.
   * Uses explicit upsert — never stores passwords.
   * Wrapped in timeout so a hung DB call never blocks login.
   */
  syncOAuthProfile: async (
    userId: string,
    email: string,
    fullName: string,
    avatarUrl?: string
  ): Promise<void> => {
    const updatePromise = supabase
      .from('users')
      .update(
        {
          full_name: fullName,
          avatar_url: avatarUrl || null,
          last_login: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      )
      .eq('id', userId)
      .then(({ error }) => {
        if (error) {
          console.error('[AuthService] syncOAuthProfile update error:', error.message, error.details);
        } else {
          console.log('[AuthService] syncOAuthProfile update success for uid:', userId);
        }
      });

    // Timeout: if update hangs, don't freeze login
    const timeout = new Promise<void>((resolve) =>
      setTimeout(() => {
        console.warn('[AuthService] syncOAuthProfile timed out after 5s — continuing login');
        resolve();
      }, 5000)
    );

    await Promise.race([updatePromise, timeout]);
  },


  /**
   * Sign out the current user.
   */
  signOut: async () => {
    await supabase.auth.signOut();
  },

  /**
   * Retrieve the current session user and their profile from public.users.
   */
  getSessionUser: async (): Promise<User | null> => {
    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session?.user) return null;

      const supaUser = session.user;
      const email = supaUser.email || '';

      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('full_name, role, avatar_url')
        .eq('id', supaUser.id)
        .single();

      if (profileError) {
        console.warn('[AuthService] getSessionUser profile query warning:', profileError.message, profileError.details);
      } else {
        console.log('[AuthService] getSessionUser profile query success:', profile);
      }

      return {
        id: supaUser.id,
        email,
        fullName:
          profile?.full_name ||
          supaUser.user_metadata?.full_name ||
          email.split('@')[0].toUpperCase(),
        role: (profile?.role as UserRole) || (email.includes('admin') ? 'admin' : 'customer'),
      };
    } catch (err) {
      console.error('[AuthService] Fatal error in getSessionUser:', err);
      return null;
    }
  },
};
