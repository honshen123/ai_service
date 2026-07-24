<template>

  <view class="page page-tab profile-page" :class="themeClass">

    <view class="profile-header">

      <view class="profile-header__actions">

        <ThemeToggle />

        <SettingsIconBtn @tap="goProfileSettings" />

      </view>

      <view class="profile-header__avatar"><text>{{ avatarText }}</text></view>

      <view class="profile-header__info">

        <text class="profile-header__name">{{ authStore.user?.nickname || authStore.user?.username || '-' }}</text>

        <text class="profile-header__sub">{{ tenant?.name || authStore.tenantCode || '租户' }}</text>

      </view>

    </view>



    <view v-if="tenant" class="quota-grid">

      <view class="quota-item">

        <text class="quota-item__value">{{ formatNumber(tenant.token_balance) }}</text>

        <text class="quota-item__label">Token</text>

      </view>

      <view class="quota-item">

        <text class="quota-item__value">{{ formatNumber(tenant.message_balance) }}</text>

        <text class="quota-item__label">消息</text>

      </view>

      <view class="quota-item">

        <text class="quota-item__value">{{ tenant.seat_used }}/{{ tenant.seat_limit }}</text>

        <text class="quota-item__label">席位</text>

      </view>

    </view>



    <view v-if="showManagementMenu" class="menu-group">

      <text class="menu-group__title">管理</text>

      <view class="list-panel menu-list">

        <view v-if="canView('knowledge:view')" class="menu-item" @tap="goKnowledge">

          <view class="menu-item__icon menu-item__icon--purple">知</view>

          <text class="menu-item__title">知识库</text>

          <view v-if="pendingQaCount > 0" class="menu-item__badge"><text>{{ pendingQaBadge }}</text></view>

          <text class="menu-item__arrow">›</text>

        </view>

        <view v-if="canManageReview" class="menu-item" @tap="goQaReview">

          <view class="menu-item__icon menu-item__icon--amber">审</view>

          <text class="menu-item__title">QA 审核</text>

          <view v-if="pendingQaCount > 0" class="menu-item__badge"><text>{{ pendingQaBadge }}</text></view>

          <text class="menu-item__arrow">›</text>

        </view>

        <view v-if="canView('shop:manage')" class="menu-item" @tap="goPlatforms">

          <view class="menu-item__icon menu-item__icon--blue">店</view>

          <text class="menu-item__title">店铺管理</text>

          <text class="menu-item__arrow">›</text>

        </view>

        <view v-if="canView('billing:view')" class="menu-item" @tap="goBilling">

          <view class="menu-item__icon menu-item__icon--amber">计</view>

          <text class="menu-item__title">计费中心</text>

          <text class="menu-item__arrow">›</text>

        </view>

        <view v-if="canView('billing:view')" class="menu-item" @tap="goBillingRecords">

          <view class="menu-item__icon menu-item__icon--gray">账</view>

          <text class="menu-item__title">账单明细</text>

          <text class="menu-item__arrow">›</text>

        </view>

        <view v-if="canManageAgents" class="menu-item" @tap="goAgents">

          <view class="menu-item__icon menu-item__icon--green">客</view>

          <text class="menu-item__title">客服管理</text>

          <text class="menu-item__arrow">›</text>

        </view>

        <view v-if="canManageAiSettings" class="menu-item" @tap="goAiSettings">

          <view class="menu-item__icon menu-item__icon--purple">AI</view>

          <text class="menu-item__title">AI 设置</text>

          <text class="menu-item__arrow">›</text>

        </view>

      </view>

    </view>



    <button class="btn-danger-plain logout-btn" @tap="onLogout">退出登录</button>

    <TabBarHost />

  </view>

</template>



<script setup lang="ts">

import { computed, ref } from 'vue';

import { onShow } from '@dcloudio/uni-app';

import TabBarHost from '@/components/TabBarHost.vue';

import ThemeToggle from '@/components/ThemeToggle.vue';

import SettingsIconBtn from '@/components/SettingsIconBtn.vue';

import { logout, qualityPending, tenantInfo } from '@/api/tenant';

import { getAccessToken, useAuthStore } from '@/store/auth';

import type { TenantInfo } from '@/types/api';

import { formatNumber } from '@/utils/session';

import { usePermissions } from '@/composables/usePermissions';

import { goAgents, goAiSettings, goBilling, goBillingRecords, goKnowledge, goPlatforms, goProfileSettings, goQaReview, toastSuccess, useThemeClass } from '@/composables/useApp';

import { initTabBar } from '@/composables/useTabBar';

const authStore = useAuthStore();

const themeClass = useThemeClass();

const tenant = ref<TenantInfo | null>(null);

const pendingQaCount = ref(0);

const { canView, isTenantAdmin, canManageAgents, canManageAiSettings, canManageReview } = usePermissions();

const showManagementMenu = computed(() =>
  canView('knowledge:view')
  || canManageReview.value
  || canView('shop:manage')
  || canView('billing:view')
  || canManageAgents.value
  || canManageAiSettings.value
  || isTenantAdmin.value,
);

const pendingQaBadge = computed(() => (pendingQaCount.value > 99 ? '99+' : String(pendingQaCount.value)));



const avatarText = computed(() => {

  const name = authStore.user?.nickname || authStore.user?.username || '?';

  return name.slice(0, 1).toUpperCase();

});



async function onLogout() {

  try { if (authStore.refreshToken) await logout(authStore.refreshToken); } catch { /* ignore */ }

  authStore.clearAuth();

  toastSuccess('已退出');

  uni.reLaunch({ url: '/pages/login/index' });

}



onShow(async () => {

  initTabBar();

  if (!getAccessToken()) { uni.reLaunch({ url: '/pages/login/index' }); return; }

  try { tenant.value = await tenantInfo(); } catch { tenant.value = null; }

  if (canView('quality:view')) {
    try {
      const result = await qualityPending({ page: 1, page_size: 1 });
      pendingQaCount.value = result.total;
    } catch {
      pendingQaCount.value = 0;
    }
  } else {
    pendingQaCount.value = 0;
  }

});

</script>



<style scoped lang="scss">

.profile-page {

  padding-bottom: calc(24px + env(safe-area-inset-bottom));

}



.profile-header {

  position: relative;

  display: flex;

  align-items: center;

  gap: 14px;

  padding: calc(var(--status-bar-height, 0px) + 20px) 16px 20px;

  background: var(--cs-bg-elevated);

  border-bottom: 1px solid var(--cs-divider);

}



.profile-header__actions {

  position: absolute;

  top: calc(var(--status-bar-height, 0px) + 12px);

  right: 16px;

  z-index: 2;

  display: flex;

  align-items: center;

  gap: 6px;

}



.profile-header__avatar {

  width: 56px;

  height: 56px;

  border-radius: 50%;

  background: var(--cs-primary-soft);

  color: var(--cs-primary);

  display: flex;

  align-items: center;

  justify-content: center;

  font-size: 22px;

  font-weight: 600;

  flex-shrink: 0;

}



.profile-header__info {

  flex: 1;

  min-width: 0;

}



.profile-header__name {

  display: block;

  font-size: 18px;

  font-weight: 600;

  color: var(--cs-text-primary);

}



.profile-header__sub {

  display: block;

  margin-top: 2px;

  font-size: 13px;

  color: var(--cs-text-muted);

}



.quota-grid {

  display: grid;

  grid-template-columns: repeat(3, 1fr);

  gap: 8px;

  padding: 12px;

}



.quota-item {

  padding: 14px 8px;

  background: var(--cs-bg-elevated);

  border-radius: var(--cs-radius-lg);

  text-align: center;

  border: 1px solid var(--cs-divider);

}



.quota-item__value {

  display: block;

  font-size: 16px;

  font-weight: 600;

  color: var(--cs-text-primary);

  font-variant-numeric: tabular-nums;

}



.quota-item__label {

  display: block;

  margin-top: 2px;

  font-size: 11px;

  color: var(--cs-text-muted);

}



.menu-group {

  margin-bottom: 8px;

}



.menu-group__title {

  display: block;

  padding: 8px 16px 6px;

  font-size: 12px;

  font-weight: 600;

  color: var(--cs-text-muted);

  letter-spacing: 0.04em;

}



.menu-list {

  margin-top: 0;

}



.menu-item {

  display: flex;

  align-items: center;

  gap: 12px;

  padding: 14px 16px;

  border-bottom: 1px solid var(--cs-divider);



  &:last-child {

    border-bottom: none;

  }



  &:active {

    background: var(--cs-bg-subtle);

  }

}



.menu-item--plain {

  justify-content: space-between;

}



.menu-item__icon {

  width: 32px;

  height: 32px;

  border-radius: var(--cs-radius-md);

  display: flex;

  align-items: center;

  justify-content: center;

  font-size: 13px;

  font-weight: 600;

  color: #fff;

  flex-shrink: 0;

}



.menu-item__icon--purple { background: var(--cs-accent); }

.menu-item__icon--blue { background: var(--cs-primary); }

.menu-item__icon--amber { background: var(--cs-warning); }

.menu-item__icon--green { background: var(--cs-success, #00b42a); }

.menu-item__icon--gray { background: var(--cs-text-muted); }

.menu-item__badge {
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: var(--cs-radius-full);
  background: var(--cs-danger);
  display: flex;
  align-items: center;
  justify-content: center;

  text {
    font-size: 10px;
    color: #fff;
    font-weight: 600;
  }
}



.menu-item__title {

  flex: 1;

  font-size: 15px;

  font-weight: 400;

  color: var(--cs-text-primary);

}



.menu-item__value {

  font-size: 14px;

  color: var(--cs-text-muted);

  font-variant-numeric: tabular-nums;

}



.menu-item__arrow {

  font-size: 18px;

  color: var(--cs-text-muted);

  font-weight: 300;

}



.logout-btn {

  margin: 16px 12px 0;

  padding: 12px;

  width: calc(100% - 24px);

}

</style>


