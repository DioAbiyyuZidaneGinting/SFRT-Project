import { create } from 'zustand';
import { AuthService } from '../services/authService';
import { supabase } from './supabase';
import { getDeviceInfo } from '../utils/deviceDetector';
import { sessionService } from '../services/sessionService';

export type UserRole = 'customer' | 'admin' | 'operator' | null;

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  isRecoverySession: boolean; // true when Supabase PASSWORD_RECOVERY event fires

  initialize: () => Promise<void>;
  signUp: (
    email: string,
    password: string,
    fullName: string,
    phoneNumber?: string
  ) => Promise<{ success: boolean; needsEmailConfirmation?: boolean }>;
  signIn: (email: string, password: string) => Promise<boolean>;
  signInWithGoogle: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<{ success: boolean }>;
  updatePassword: (newPassword: string) => Promise<{ success: boolean; error: string | null }>;
  logout: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  isRecoverySession: false,

  initialize: async () => {
    try {
      set({ isLoading: true });
      const user = await AuthService.getSessionUser();
      if (user) {
        set({ user, isAuthenticated: true });
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const deviceInfo = getDeviceInfo();
          sessionService.recordSession(user.id, session.id, deviceInfo);
        }
      }

      // Listen for global auth lifecycle events
      supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('[AuthStore] onAuthStateChange:', event);

        if (event === 'SIGNED_OUT') {
          set({ user: null, isAuthenticated: false, isRecoverySession: false });
        } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          // Handle Google OAuth post-callback session pickup
          if (session?.user) {
            const supaUser = session.user;
            const email = supaUser.email || '';
            const metaFullName = supaUser.user_metadata?.full_name || '';
            const metaAvatar = supaUser.user_metadata?.avatar_url || '';

            // Sync OAuth profile (safe to call even for password logins — upsert won't overwrite role)
            if (metaFullName || metaAvatar) {
              AuthService.syncOAuthProfile(supaUser.id, email, metaFullName, metaAvatar)
                .catch((err) => console.warn('[AuthStore] Sync warning:', err));
            }

            const updatedUser = await AuthService.getSessionUser();
            set({ user: updatedUser, isAuthenticated: !!updatedUser, isRecoverySession: false });
            
            if (updatedUser && session) {
              const deviceInfo = getDeviceInfo();
              sessionService.recordSession(updatedUser.id, session.id, deviceInfo);
            }
          }
        } else if (event === 'PASSWORD_RECOVERY') {
          // Magic recovery link clicked — mark recovery session
          // /reset-password page listens for this flag to show the password form
          set({ isRecoverySession: true, isLoading: false });
        }
      });
    } finally {
      set({ isLoading: false });
    }
  },

  signUp: async (email, password, fullName, phoneNumber = '') => {
    set({ isLoading: true, error: null });
    const { user, needsEmailConfirmation, error } = await AuthService.signUp(
      email,
      password,
      fullName,
      phoneNumber
    );

    if (error) {
      set({ error, isLoading: false });
      return { success: false, needsEmailConfirmation: false };
    }

    if (needsEmailConfirmation) {
      set({ isLoading: false });
      return { success: true, needsEmailConfirmation: true };
    }

    set({ user, isAuthenticated: true, isLoading: false });
    return { success: true, needsEmailConfirmation: false };
  },

  signIn: async (email, password) => {
    set({ isLoading: true, error: null });
    const { user, error } = await AuthService.signIn(email, password);

    if (error) {
      set({ error, isLoading: false });
      return false;
    }

    set({ user, isAuthenticated: true, isLoading: false });
    return true;
  },

  signInWithGoogle: async () => {
    set({ isLoading: true, error: null });
    const { error } = await AuthService.signInWithGoogle();

    if (error) {
      set({ error, isLoading: false });
    }
    // If no error, browser will redirect to Google — isLoading stays true intentionally
  },

  requestPasswordReset: async (email: string) => {
    set({ isLoading: true, error: null });
    // Always returns success for security ambiguity
    await AuthService.requestPasswordReset(email);
    set({ isLoading: false });
    return { success: true };
  },

  updatePassword: async (newPassword: string) => {
    set({ isLoading: true, error: null });
    const { error } = await AuthService.updatePassword(newPassword);

    if (error) {
      set({ error, isLoading: false });
      return { success: false, error };
    }

    // Supabase manages session after updateUser — no manual invalidation
    set({ isLoading: false, isRecoverySession: false });
    return { success: true, error: null };
  },

  logout: async () => {
    // Do NOT set isLoading: true here — it causes App.tsx to flash the boot screen
    // before the signOut completes. Logout is fast and doesn't need a loading state.
    await AuthService.signOut();
    set({ user: null, isAuthenticated: false, isLoading: false, isRecoverySession: false });
  },

  clearError: () => set({ error: null }),
}));
