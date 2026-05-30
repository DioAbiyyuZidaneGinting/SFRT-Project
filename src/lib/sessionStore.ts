import { create } from 'zustand';
import { UserSession } from '../types';
import { sessionService } from '../services/sessionService';
import { supabase } from './supabase';
import { getDeviceInfo } from '../utils/deviceDetector';

interface SessionState {
  sessions: UserSession[];
  isLoadingSessions: boolean;
  sessionsError: string | null;
  loadSessions: (userId: string) => Promise<void>;
  revokeSession: (sessionId: string) => Promise<boolean>;
  recordCurrentSession: (userId: string) => Promise<void>;
}

export const useSessionStore = create<SessionState>((set) => ({
  sessions: [],
  isLoadingSessions: false,
  sessionsError: null,

  loadSessions: async (userId: string) => {
    set({ isLoadingSessions: true, sessionsError: null });
    const { data: { session } } = await supabase.auth.getSession();
    const currentSessionId = session?.id;
    
    const { data, error } = await sessionService.fetchUserSessions(userId);
    if (error) {
      set({ sessionsError: error, isLoadingSessions: false });
    } else {
      // If current local session is not found in database records, it has been revoked from another device.
      if (currentSessionId && data.length > 0 && !data.some(s => s.sessionId === currentSessionId)) {
        console.warn('[SessionStore] Local session revoked by user. Logging out...');
        set({ sessions: [], isLoadingSessions: false });
        await supabase.auth.signOut();
        // Soft reload to clear auth state and trigger redirection
        window.location.href = '/';
        return;
      }

      const mapped = data.map((s) => ({
        ...s,
        isCurrentSession: s.sessionId === currentSessionId,
      }));
      set({ sessions: mapped, isLoadingSessions: false });
    }
  },

  revokeSession: async (sessionId: string) => {
    const { success, error } = await sessionService.revokeSession(sessionId);
    if (success) {
      set((state) => ({
        sessions: state.sessions.filter((s) => s.sessionId !== sessionId),
      }));
      
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.id === sessionId) {
        await supabase.auth.signOut();
        window.location.href = '/';
      }
    } else {
      set({ sessionsError: error });
    }
    return success;
  },

  recordCurrentSession: async (userId: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const deviceInfo = getDeviceInfo();
      await sessionService.recordSession(userId, session.id, deviceInfo);
    }
  },
}));
