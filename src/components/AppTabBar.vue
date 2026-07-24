<template>
  <view class="app-tabbar" :class="themeClass">
    <view class="app-tabbar__inner">
      <view
        v-for="item in tabs"
        :key="item.pagePath"
        class="app-tabbar__item"
        :class="{ 'app-tabbar__item--active': activePath === item.pagePath }"
        @tap="switchTab(item.pagePath)"
      >
        <view class="app-tabbar__icon-wrap">
          <TabIcon :name="item.icon" :active="activePath === item.pagePath" />
          <view v-if="item.badge && badgeText" class="app-tabbar__badge">
            <text>{{ badgeText }}</text>
          </view>
        </view>
        <text class="app-tabbar__label">{{ item.text }}</text>
      </view>
    </view>
    <view class="app-tabbar__safe" />
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import TabIcon from '@/components/TabIcon.vue';
import { useThemeClass } from '@/composables/useApp';
import { usePermissions } from '@/composables/usePermissions';
import { useNotificationStore } from '@/store/notification';
import { getVisibleTabs, useTabStore } from '@/store/tab';

const themeClass = useThemeClass();
const tabStore = useTabStore();
const notificationStore = useNotificationStore();
const { activePath } = storeToRefs(tabStore);
const { unreadCount } = storeToRefs(notificationStore);
const { permissions } = usePermissions();
const tabs = computed(() => getVisibleTabs(permissions.value));

const badgeText = computed(() => {
  if (unreadCount.value <= 0) return '';
  return unreadCount.value > 99 ? '99+' : String(unreadCount.value);
});

function switchTab(url: string) {
  if (activePath.value === url) return;
  tabStore.setActivePath(url);
  uni.switchTab({ url });
}
</script>

<style scoped lang="scss">
.app-tabbar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 999;
  background: var(--cs-tab-bg);
  border-top: 1px solid var(--cs-tab-border);
  box-shadow: var(--cs-tab-shadow);
}

.app-tabbar__inner {
  display: flex;
  align-items: stretch;
  height: 52px;
  padding: 0 2px;
}

.app-tabbar__item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  padding: 4px 0;
  color: var(--cs-tab-inactive);
  min-width: 0;

  &:active {
    opacity: 0.75;
  }
}

.app-tabbar__item--active {
  color: var(--cs-tab-active);

  .app-tabbar__label {
    font-weight: 600;
    color: var(--cs-tab-active);
  }
}

.app-tabbar__icon-wrap {
  position: relative;
  width: 24px;
  height: 24px;
}

.app-tabbar__badge {
  position: absolute;
  top: -4px;
  right: -10px;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  border-radius: var(--cs-radius-full);
  background: var(--cs-danger);
  border: 1.5px solid var(--cs-tab-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;

  text {
    font-size: 9px;
    line-height: 1;
    color: #fff;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
  }
}

.app-tabbar__label {
  font-size: 10px;
  line-height: 1.2;
  color: var(--cs-tab-inactive);
  font-weight: 400;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.app-tabbar__safe {
  height: env(safe-area-inset-bottom);
  background: var(--cs-tab-bg);
}
</style>
