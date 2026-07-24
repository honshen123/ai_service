<template>
  <view class="page page-tab notifications-page" :class="themeClass">
    <PageHeader title="消息" description="系统通知与业务提醒" :show-brand="false">
      <template #action>
        <button
          class="notify-read-all"
          :disabled="unreadCount === 0 || markingAll"
          @tap="onMarkAllRead"
        >
          全部已读
        </button>
      </template>
    </PageHeader>

    <scroll-view scroll-y class="notifications-scroll" @scrolltolower="loadMore">
      <view v-if="loading && notifications.length === 0" class="empty-box">加载中...</view>
      <view v-else-if="notifications.length === 0" class="empty-box">暂无新消息</view>

      <view v-else class="list-panel notify-list">
        <view
          v-for="item in notifications"
          :key="item.key"
          class="notify-item"
          :class="{ 'notify-item--unread': !item.is_read }"
          @tap="onItemTap(item)"
        >
          <view class="notify-item__head">
            <text class="notify-item__title">{{ item.title }}</text>
            <text class="notify-item__time">{{ formatNotifyTime(item.create_time) }}</text>
          </view>
          <text
            v-if="notificationTypeLabel(item.type)"
            class="notify-type"
            :class="notificationTypeClass(item.type)"
          >
            {{ notificationTypeLabel(item.type) }}
          </text>
          <text class="notify-item__content">{{ item.content }}</text>
        </view>
      </view>
    </scroll-view>

    <TabBarHost />
  </view>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { ref } from 'vue';
import { onPullDownRefresh, onShow } from '@dcloudio/uni-app';
import TabBarHost from '@/components/TabBarHost.vue';
import PageHeader from '@/components/PageHeader.vue';
import { fetchNotifications } from '@/api/tenant';
import type { NotificationItem } from '@/types/api';
import { formatNotifyTime, notificationTypeClass, notificationTypeLabel } from '@/utils/notification';
import { ensurePermission } from '@/composables/useAccessGuard';
import { useNotificationStore } from '@/store/notification';
import { goChat, toastSuccess, useThemeClass } from '@/composables/useApp';
import { initTabBar } from '@/composables/useTabBar';
import { initNotificationPolling } from '@/composables/useNotificationPolling';

const themeClass = useThemeClass();
const notificationStore = useNotificationStore();
const { unreadCount } = storeToRefs(notificationStore);

const notifications = ref<NotificationItem[]>([]);
const loading = ref(false);
const markingAll = ref(false);
const loaded = ref(false);

async function loadNotifications() {
  loading.value = true;
  try {
    const inbox = await fetchNotifications(50);
    notifications.value = inbox.list;
    notificationStore.setUnreadCount(inbox.unread_count);
    loaded.value = true;
  } finally {
    loading.value = false;
    uni.stopPullDownRefresh();
  }
}

async function onItemTap(item: NotificationItem) {
  if (!item.is_read) {
    try {
      await notificationStore.markRead([item.key]);
      item.is_read = true;
    } catch {
      // ignore
    }
  }

  const sessionId = Number(item.meta?.session_id || 0);
  if (sessionId > 0) {
    goChat(sessionId);
    return;
  }

  if (item.link?.includes('/tickets')) {
    uni.switchTab({ url: '/pages/tickets/index' });
    return;
  }

  if (item.link?.includes('/billing')) {
    uni.navigateTo({ url: '/pages/billing/index' });
  }
}

async function onMarkAllRead() {
  if (unreadCount.value === 0) return;
  markingAll.value = true;
  try {
    await notificationStore.markAllRead();
    notifications.value = notifications.value.map((item) => ({ ...item, is_read: true }));
    toastSuccess('已全部标记为已读');
  } finally {
    markingAll.value = false;
  }
}

function loadMore() {
  // 当前接口一次拉取足够条目
}

onShow(() => {
  initTabBar();
  initNotificationPolling();
  if (!ensurePermission('session:view')) return;
  loadNotifications();
});

onPullDownRefresh(() => loadNotifications());
</script>

<style scoped lang="scss">
.notifications-scroll {
  height: calc(100vh - 100px);
  padding-bottom: 8px;
}

.notify-read-all {
  padding: 6px 10px;
  font-size: 12px;
  color: var(--cs-primary);
  background: var(--cs-primary-soft);
  border-radius: var(--cs-radius-md);
  line-height: 1.2;

  &[disabled] {
    opacity: 0.45;
  }
}

.notify-list {
  margin-top: 0;
}

.notify-item {
  padding: 14px 16px;
  border-bottom: 1px solid var(--cs-divider);

  &:last-child {
    border-bottom: none;
  }

  &:active {
    background: var(--cs-bg-subtle);
  }
}

.notify-item--unread {
  background: rgba(51, 112, 255, 0.04);

  .notify-item__title {
    font-weight: 600;
  }

  .notify-item__title::before {
    content: '';
    display: inline-block;
    width: 6px;
    height: 6px;
    margin-right: 6px;
    border-radius: 50%;
    background: var(--cs-primary);
    vertical-align: middle;
  }
}

.notify-item__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.notify-item__title {
  flex: 1;
  min-width: 0;
  font-size: 15px;
  color: var(--cs-text-primary);
  line-height: 1.4;
}

.notify-item__time {
  flex-shrink: 0;
  font-size: 11px;
  color: var(--cs-text-muted);
}

.notify-type {
  display: inline-block;
  margin-top: 8px;
  padding: 2px 8px;
  border-radius: var(--cs-radius-full);
  font-size: 11px;
  line-height: 1.5;
}

.notify-type--danger {
  color: var(--cs-danger);
  background: var(--cs-danger-soft);
}

.notify-type--warning {
  color: var(--cs-warning);
  background: var(--cs-warning-soft);
}

.notify-type--success {
  color: var(--cs-success);
  background: var(--cs-success-soft);
}

.notify-type--info {
  color: var(--cs-primary);
  background: var(--cs-primary-soft);
}

.notify-item__content {
  display: block;
  margin-top: 8px;
  font-size: 13px;
  line-height: 1.5;
  color: var(--cs-text-secondary);
}
</style>
