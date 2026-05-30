import { supabase } from '../lib/supabase';
import { UserSession } from '../types';
import { DeviceInfo } from '../utils/deviceDetector';

let ipCache: string | null = null;
async function getIpAddress(): Promise<string> {
  if (ipCache) return ipCache;
  try {
    const res = await Promise.race([
      fetch('https://api.ipify.org?format=json').then(r => r.json()),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 2000))
    ]) as any;
    if (res && res.ip) {
      ipCache = res.ip;
      return res.ip;
    }
  } catch (e) {
    console.warn('Failed to fetch IP address:', e);
  }
  return '127.0.0.1'; // fallback
}

export const sessionService = {
  /**
   * Record or update the current active session in Supabase user_sessions
   */
  recordSession: async (userId: string, sessionId: string, deviceInfo: DeviceInfo): Promise<void> => {
    try {
      const ipAddress = await getIpAddress();
      
      // Check if there is an existing session for this user with same device_name, browser, os
      const { data: existingSessions, error: findError } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('device_name', deviceInfo.deviceName)
        .eq('browser', deviceInfo.browser)
        .eq('os', deviceInfo.os);

      if (findError) throw findError;

      if (existingSessions && existingSessions.length > 0) {
        // Update the existing record instead of creating a duplicate
        const targetSession = existingSessions[0];
        const { error: updateError } = await supabase
          .from('user_sessions')
          .update({
            session_id: sessionId, // update to current active session_id
            ip_address: ipAddress,
            user_agent: deviceInfo.userAgent,
            last_active: new Date().toISOString()
          })
          .eq('id', targetSession.id);

        if (updateError) throw updateError;
      } else {
        // Create new session entry
        const { error: insertError } = await supabase
          .from('user_sessions')
          .insert({
            session_id: sessionId,
            user_id: userId,
            device_name: deviceInfo.deviceName,
            browser: deviceInfo.browser,
            os: deviceInfo.os,
            ip_address: ipAddress,
            user_agent: deviceInfo.userAgent,
            last_active: new Date().toISOString()
          });

        if (insertError) throw insertError;
      }
    } catch (err) {
      console.error('[SessionService] Failed to record user session:', err);
    }
  },

  /**
   * Fetch all active sessions for a user
   */
  fetchUserSessions: async (userId: string): Promise<{ data: UserSession[]; error: string | null }> => {
    try {
      const { data, error } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('last_active', { ascending: false });

      if (error) throw error;

      // Filter out duplicate browser/OS/device entries in memory (keeping the most recently active)
      const uniqueSessions: typeof data = [];
      const seenKeys = new Set<string>();
      const duplicateIds: string[] = [];

      (data || []).forEach(item => {
        const key = `${item.device_name}::${item.browser}::${item.os}`;
        if (seenKeys.has(key)) {
          duplicateIds.push(item.id);
        } else {
          seenKeys.add(key);
          uniqueSessions.push(item);
        }
      });

      // Clean up the database duplicates asynchronously in the background
      if (duplicateIds.length > 0) {
        supabase
          .from('user_sessions')
          .delete()
          .in('id', duplicateIds)
          .then(({ error: delErr }) => {
            if (delErr) console.warn('[SessionService] Failed to clean up duplicate sessions:', delErr);
          });
      }

      const formatted: UserSession[] = uniqueSessions.map(item => ({
        id: item.id,
        sessionId: item.session_id,
        userId: item.user_id,
        deviceName: item.device_name,
        browser: item.browser,
        os: item.os,
        ipAddress: item.ip_address,
        userAgent: item.user_agent,
        lastActive: item.last_active,
        createdAt: item.created_at
      }));

      return { data: formatted, error: null };
    } catch (err: any) {
      console.error('[SessionService] Failed to fetch user sessions:', err);
      return { data: [], error: err.message || 'Failed to fetch sessions.' };
    }
  },

  /**
   * Delete/revoke a specific session (force logout of that device)
   */
  revokeSession: async (sessionId: string): Promise<{ success: boolean; error: string | null }> => {
    try {
      const { error } = await supabase
        .from('user_sessions')
        .delete()
        .eq('session_id', sessionId);

      if (error) throw error;
      return { success: true, error: null };
    } catch (err: any) {
      console.error('[SessionService] Failed to revoke session:', err);
      return { success: false, error: err.message || 'Failed to revoke session.' };
    }
  }
};
