<template>
  <view class="page page-with-nav platforms-page" :class="themeClass">
    <scroll-view scroll-y class="platforms-scroll">
      <view class="platforms-wrap">
        <view class="card-block platforms-section">
          <view class="platforms-section__head">
            <text class="platforms-section__title">支持平台</text>
            <text class="platforms-section__desc">当前租户可接入的电商平台</text>
          </view>
          <view class="platforms-section__body">
            <view v-if="platforms.length" class="platform-tags">
              <text v-for="item in platforms" :key="item.code" class="platform-tag">{{ item.name }}</text>
            </view>
            <view v-else class="platforms-empty">暂无可用平台</view>
          </view>
        </view>

        <view class="card-block platforms-section">
          <view class="platforms-section__head">
            <text class="platforms-section__title">绑定店铺</text>
            <text class="platforms-section__desc">选择平台并填写店铺信息</text>
          </view>
          <view class="platforms-section__body">
            <view class="form-field">
              <text class="form-field__label">平台</text>
              <picker
                v-if="platforms.length"
                mode="selector"
                :range="platformNames"
                :value="platformIndex"
                @change="onPlatformChange"
              >
                <view class="select-field">
                  <text class="select-field__value" :class="{ 'select-field__value--placeholder': !selectedPlatformName }">
                    {{ selectedPlatformName || '请选择平台' }}
                  </text>
                  <text class="select-field__arrow">›</text>
                </view>
              </picker>
              <input
                v-else
                v-model="bindForm.platform"
                class="form-field__input"
                placeholder="如 taobao"
              />
            </view>
            <view class="form-field">
              <text class="form-field__label">店铺 ID</text>
              <input
                v-model="bindForm.shop_id"
                class="form-field__input"
                placeholder="平台侧店铺唯一标识"
              />
            </view>
            <view class="form-field form-field--last">
              <text class="form-field__label">店铺名称</text>
              <input
                v-model="bindForm.shop_name"
                class="form-field__input"
                placeholder="便于识别的展示名称"
              />
            </view>
            <view class="platforms-action">
              <button class="platforms-btn btn-primary" :loading="binding" @tap="submitBind">绑定店铺</button>
            </view>
          </view>
        </view>

        <view class="card-block platforms-section">
          <view class="platforms-section__head">
            <text class="platforms-section__title">已绑定店铺</text>
            <text class="platforms-section__desc">共 {{ shops.length }} 家店铺</text>
          </view>
          <view class="platforms-section__body platforms-section__body--list">
            <view v-if="shops.length" class="shop-list">
              <view v-for="shop in shops" :key="shop.id" class="shop-card">
                <view class="shop-card__head">
                  <text class="shop-card__name">{{ shop.shop_name }}</text>
                  <text
                    class="badge-hosting"
                    :class="'badge-hosting--' + hostingModeType(shop.hosting_mode)"
                  >
                    {{ hostingModeText(shop.hosting_mode) }}
                  </text>
                </view>
                <text class="shop-card__meta">{{ platformLabel(shop.platform) }} · ID {{ shop.shop_id }}</text>
              </view>
            </view>
            <view v-else class="empty-box">暂无绑定店铺</view>
          </view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { onPullDownRefresh, onShow } from '@dcloudio/uni-app';
import { computed, reactive, ref } from 'vue';
import { bindPlatformShop, platformShops, supportedPlatforms } from '@/api/tenant';
import type { PlatformItem, PlatformShopItem } from '@/types/api';
import { hostingModeText, hostingModeType, platformLabel } from '@/utils/session';
import { ensurePermission } from '@/composables/useAccessGuard';
import { toastSuccess, useThemeClass } from '@/composables/useApp';

const themeClass = useThemeClass();
const platforms = ref<PlatformItem[]>([]);
const shops = ref<PlatformShopItem[]>([]);
const binding = ref(false);
const bindForm = reactive({ platform: '', shop_id: '', shop_name: '', seller_id: '' });

const platformNames = computed(() => platforms.value.map((item) => item.name));

const platformIndex = computed(() => {
  const idx = platforms.value.findIndex((item) => item.code === bindForm.platform);
  return idx >= 0 ? idx : 0;
});

const selectedPlatformName = computed(() => {
  const item = platforms.value.find((p) => p.code === bindForm.platform);
  return item?.name || '';
});

function onPlatformChange(event: { detail: { value: string | number } }) {
  const idx = Number(event.detail.value);
  const item = platforms.value[idx];
  if (item) bindForm.platform = item.code;
}

async function loadAll() {
  const [p, s] = await Promise.all([supportedPlatforms(), platformShops()]);
  platforms.value = p;
  shops.value = s;
  if (!bindForm.platform && p.length > 0) bindForm.platform = p[0].code;
  uni.stopPullDownRefresh();
}

async function submitBind() {
  if (!bindForm.platform.trim() || !bindForm.shop_id.trim() || !bindForm.shop_name.trim()) return;
  binding.value = true;
  try {
    await bindPlatformShop({
      platform: bindForm.platform.trim(),
      shop_id: bindForm.shop_id.trim(),
      shop_name: bindForm.shop_name.trim(),
      seller_id: bindForm.seller_id.trim(),
      hosting_mode: 1,
    });
    toastSuccess('绑定成功');
    bindForm.shop_id = '';
    bindForm.shop_name = '';
    await loadAll();
  } finally {
    binding.value = false;
  }
}

onShow(() => {
  if (!ensurePermission('shop:manage')) return;
  loadAll();
});
onPullDownRefresh(() => {
  if (!ensurePermission('shop:manage')) {
    uni.stopPullDownRefresh();
    return;
  }
  loadAll();
});
</script>

<style scoped lang="scss">
.platforms-page {
  min-height: 100vh;
  background: var(--cs-bg-page);
}

.platforms-scroll {
  height: calc(100vh - 44px);
  box-sizing: border-box;
}

.platforms-wrap {
  padding: 12px 0 calc(24px + env(safe-area-inset-bottom));
}

.platforms-section__head {
  padding: 16px 16px 12px;
  border-bottom: 1px solid var(--cs-divider);
}

.platforms-section__title {
  display: block;
  font-size: 16px;
  font-weight: 600;
  color: var(--cs-text-primary);
  line-height: 1.35;
}

.platforms-section__desc {
  display: block;
  margin-top: 4px;
  font-size: 13px;
  color: var(--cs-text-muted);
  line-height: 1.4;
}

.platforms-section__body {
  padding: 16px;
}

.platforms-section__body--list {
  padding-top: 12px;
}

.platform-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.platform-tag {
  padding: 6px 12px;
  border-radius: var(--cs-radius-full);
  background: var(--cs-primary-soft);
  color: var(--cs-primary);
  font-size: 12px;
  line-height: 1.3;
}

.select-field {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 44px;
  padding: 10px 12px;
  background: var(--cs-bg-input);
  border: 1px solid var(--cs-divider);
  border-radius: var(--cs-radius-md);
  box-sizing: border-box;
}

.select-field__value {
  flex: 1;
  min-width: 0;
  font-size: 15px;
  color: var(--cs-text-primary);
  line-height: 1.4;
}

.select-field__value--placeholder {
  color: var(--cs-text-muted);
}

.select-field__arrow {
  flex-shrink: 0;
  font-size: 18px;
  color: var(--cs-text-muted);
  font-weight: 300;
  line-height: 1;
}

.platforms-empty {
  font-size: 13px;
  color: var(--cs-text-muted);
  text-align: center;
  padding: 8px 0;
}

.form-field {
  margin-bottom: 14px;
}

.form-field--last {
  margin-bottom: 0;
}

.platforms-action {
  margin-top: 20px;
  padding-top: 4px;
}

.platforms-btn {
  width: 100%;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  font-weight: 500;
  border-radius: var(--cs-radius-md);
}

.shop-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.shop-card {
  padding: 14px;
  background: var(--cs-bg-subtle);
  border: 1px solid var(--cs-divider);
  border-radius: var(--cs-radius-md);
}

.shop-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.shop-card__name {
  flex: 1;
  min-width: 0;
  font-size: 15px;
  font-weight: 600;
  color: var(--cs-text-primary);
  line-height: 1.35;
}

.shop-card__meta {
  display: block;
  margin-top: 8px;
  font-size: 12px;
  color: var(--cs-text-muted);
  line-height: 1.4;
}
</style>
