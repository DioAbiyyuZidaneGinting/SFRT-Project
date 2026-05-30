import { create } from 'zustand';
import { AppNotification } from '../types';
import { notificationService } from '../services/notificationService';

interface NotificationState {
  notifications: AppNotification[];
  isLoadingNotifications: boolean;
  notificationError: string | null;
  loadNotifications: (userId: string) => Promise<void>;
  asyncCreateNotification: (userId: string, notification: Omit<AppNotification, 'id' | 'userId' | 'createdAt' | 'isRead'>) => Promise<boolean>;
  asyncMarkAsRead: (notificationId: string) => Promise<boolean>;
  asyncMarkAllAsRead: (userId: string) => Promise<boolean>;
  addNotificationOptimistic: (notification: AppNotification) => void;
  updateNotificationOptimistic: (notification: AppNotification) => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  isLoadingNotifications: false,
  notificationError: null,

  loadNotifications: async (userId: string) => {
    set({ isLoadingNotifications: true, notificationError: null });
    const { data, error } = await notificationService.fetchUserNotifications(userId);
    if (error) {
      set({ notificationError: error, isLoadingNotifications: false });
    } else {
      set({ notifications: data, isLoadingNotifications: false });
    }
  },

  asyncCreateNotification: async (userId, notificationData) => {
    const { success, error } = await notificationService.createNotification(userId, notificationData);
    if (error) {
      set({ notificationError: error });
    }
    return success;
  },

  asyncMarkAsRead: async (notificationId) => {
    const { success, error } = await notificationService.markAsRead(notificationId);
    if (success) {
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === notificationId ? { ...n, isRead: true } : n
        ),
      }));
    } else {
      set({ notificationError: error });
    }
    return success;
  },

  asyncMarkAllAsRead: async (userId) => {
    const { success, error } = await notificationService.markAllAsRead(userId);
    if (success) {
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
      }));
    } else {
      set({ notificationError: error });
    }
    return success;
  },

  addNotificationOptimistic: (notification) => {
    set((state) => {
      if (state.notifications.some((n) => n.id === notification.id)) {
        return state;
      }
      return { notifications: [notification, ...state.notifications] };
    });
  },

  updateNotificationOptimistic: (notification) => {
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === notification.id ? notification : n
      ),
    }));
  },
}));
