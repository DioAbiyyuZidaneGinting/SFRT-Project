import { supabase } from '../lib/supabase';
import { AppNotification } from '../types';

export const notificationService = {
  /**
   * Fetch notifications for a specific user
   */
  fetchUserNotifications: async (userId: string): Promise<{ data: AppNotification[]; error: string | null }> => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedNotifications: AppNotification[] = (data || []).map(item => ({
        id: item.id,
        userId: item.user_id,
        title: item.title,
        message: item.message,
        type: item.type as any,
        category: item.category as any,
        isRead: item.is_read,
        actionUrl: item.action_url,
        createdAt: item.created_at,
      }));

      return { data: formattedNotifications, error: null };
    } catch (err: any) {
      console.error('[NotificationService] Failed to fetch notifications:', err);
      return { data: [], error: err.message || 'Failed to load notifications.' };
    }
  },

  /**
   * Create a new notification record in Supabase
   */
  createNotification: async (
    userId: string,
    notification: Omit<AppNotification, 'id' | 'userId' | 'createdAt' | 'isRead'>
  ): Promise<{ success: boolean; error: string | null }> => {
    try {
      const { error } = await supabase
        .from('notifications')
        .insert([{
          user_id: userId,
          title: notification.title,
          message: notification.message,
          type: notification.type,
          category: notification.category,
          is_read: false,
          action_url: notification.actionUrl || null,
        }]);

      if (error) throw error;
      return { success: true, error: null };
    } catch (err: any) {
      console.error('[NotificationService] Failed to create notification:', err);
      return { success: false, error: err.message || 'Failed to create notification.' };
    }
  },

  /**
   * Mark a specific notification as read
   */
  markAsRead: async (notificationId: string): Promise<{ success: boolean; error: string | null }> => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;
      return { success: true, error: null };
    } catch (err: any) {
      console.error('[NotificationService] Failed to mark notification as read:', err);
      return { success: false, error: err.message || 'Failed to update notification.' };
    }
  },

  /**
   * Mark all unread notifications for a user as read
   */
  markAllAsRead: async (userId: string): Promise<{ success: boolean; error: string | null }> => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) throw error;
      return { success: true, error: null };
    } catch (err: any) {
      console.error('[NotificationService] Failed to mark all notifications as read:', err);
      return { success: false, error: err.message || 'Failed to update notifications.' };
    }
  },

  /**
   * Subscribe to real-time notification additions for a user
   */
  subscribeToNotifications: (
    userId: string,
    onInsert: (notification: AppNotification) => void,
    onUpdate: (notification: AppNotification) => void
  ) => {
    const channelName = `realtime-notifications-${userId}`;
    console.log(`[NotificationService] Initializing database subscription: ${channelName}`);

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log('[NotificationService] Real-time webhook payload received:', payload);
          if (payload.eventType === 'INSERT') {
            const item = payload.new;
            const formatted: AppNotification = {
              id: item.id,
              userId: item.user_id,
              title: item.title,
              message: item.message,
              type: item.type as any,
              category: item.category as any,
              isRead: item.is_read,
              actionUrl: item.action_url,
              createdAt: item.created_at,
            };
            onInsert(formatted);
          } else if (payload.eventType === 'UPDATE') {
            const item = payload.new;
            const formatted: AppNotification = {
              id: item.id,
              userId: item.user_id,
              title: item.title,
              message: item.message,
              type: item.type as any,
              category: item.category as any,
              isRead: item.is_read,
              actionUrl: item.action_url,
              createdAt: item.created_at,
            };
            onUpdate(formatted);
          }
        }
      )
      .subscribe();

    return () => {
      console.log(`[NotificationService] Cleaning up database subscription: ${channelName}`);
      supabase.removeChannel(channel);
    };
  }
};
