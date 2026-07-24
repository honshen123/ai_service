import { getAccessToken } from '@/store/auth';
import { useNotificationStore } from '@/store/notification';

export function initNotificationPolling() {
  if (getAccessToken()) {
    useNotificationStore().startPolling();
  } else {
    useNotificationStore().stopPolling();
    useNotificationStore().setUnreadCount(0);
  }
}
