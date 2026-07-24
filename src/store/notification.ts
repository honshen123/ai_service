import { defineStore } from 'pinia';
import { fetchNotifications, markAllNotificationsRead, markNotificationsRead } from '@/api/tenant';
import { getAccessToken } from '@/store/auth';

let pollTimer: ReturnType<typeof setInterval> | null = null;

export const useNotificationStore = defineStore('mobile-notification', {
  state: () => ({
    unreadCount: 0,
  }),
  actions: {
    setUnreadCount(count: number) {
      this.unreadCount = Math.max(0, count);
    },
    async refreshUnread() {
      if (!getAccessToken()) {
        this.unreadCount = 0;
        return;
      }
      try {
        const inbox = await fetchNotifications(1);
        this.unreadCount = inbox.unread_count;
      } catch {
        // 轮询失败静默处理
      }
    },
    startPolling() {
      this.stopPolling();
      this.refreshUnread();
      pollTimer = setInterval(() => {
        this.refreshUnread();
      }, 30000);
    },
    stopPolling() {
      if (pollTimer) {
        clearInterval(pollTimer);
        pollTimer = null;
      }
    },
    async markRead(keys: string[]) {
      if (keys.length === 0) return;
      await markNotificationsRead(keys);
      this.unreadCount = Math.max(0, this.unreadCount - keys.length);
      await this.refreshUnread();
    },
    async markAllRead() {
      await markAllNotificationsRead();
      this.unreadCount = 0;
    },
  },
});
