<template>
  <view class="page page-with-nav billing-page" :class="themeClass">
    <scroll-view scroll-y class="scroll-body">
      <view v-if="wallet" class="wallet-hero">
        <text class="wallet-hero__label">Token 余额</text>
        <text class="wallet-hero__value">{{ formatNumber(wallet.token_balance) }}</text>
        <view class="wallet-hero__grid">
          <view>
            <text class="wallet-hero__item-label">消息余额</text>
            <text class="wallet-hero__item-value">{{ formatNumber(wallet.message_balance) }}</text>
          </view>
          <view>
            <text class="wallet-hero__item-label">席位</text>
            <text class="wallet-hero__item-value">{{ wallet.seat_used }}/{{ wallet.seat_limit }}</text>
          </view>
          <view>
            <text class="wallet-hero__item-label">店铺</text>
            <text class="wallet-hero__item-value">{{ wallet.shop_used }}/{{ wallet.shop_limit }}</text>
          </view>
        </view>
      </view>

      <view class="card-block">
        <text class="section-title">套餐购买</text>
        <view v-for="pkg in packages" :key="pkg.id" class="package-row">
          <view>
            <text class="package-row__name">{{ pkg.name }}</text>
            <text class="package-row__quota">Token {{ formatNumber(pkg.token_quota) }}</text>
          </view>
          <view v-if="canManageBilling" class="package-row__actions">
            <button class="btn-plain mini-btn" @tap="buy(pkg.id, 'monthly')">月付</button>
            <button class="btn-primary mini-btn" @tap="buy(pkg.id, 'yearly')">年付</button>
          </view>
        </view>
        <view v-if="packages.length === 0" class="empty-box">暂无可用套餐</view>
      </view>

      <view class="card-block">
        <text class="section-title">待支付订单</text>
        <view v-for="order in pendingOrders" :key="order.id" class="order-row">
          <view class="order-row__head">
            <text>{{ order.order_no }}</text>
            <text class="order-row__amount">¥{{ order.pay_amount }}</text>
          </view>
          <text class="order-row__type">{{ orderTypeText(order.order_type) }}</text>
          <view v-if="canPayBilling" class="order-row__channels">
            <button
              v-for="ch in paymentChannels"
              :key="ch.code"
              class="btn-primary mini-btn"
              :disabled="!ch.enabled"
              @tap="pay(order.id, ch.code)"
            >
              {{ ch.name }}
            </button>
          </view>
        </view>
        <view v-if="pendingOrders.length === 0" class="empty-box">暂无待支付订单</view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { onPullDownRefresh, onShow } from '@dcloudio/uni-app';
import {
  billingOrders,
  billingPackages,
  billingPaymentChannels,
  billingWallet,
  confirmPayment,
  createBillingOrder,
  payBillingOrder,
} from '@/api/tenant';
import type { BillingOrder, BillingPackage, BillingPaymentChannel, BillingWallet } from '@/types/api';
import { formatNumber, orderTypeText } from '@/utils/session';
import { hasPermission } from '@/utils/permission';
import { useAuthStore } from '@/store/auth';
import { ensurePermission } from '@/composables/useAccessGuard';
import { toast, toastSuccess, useThemeClass } from '@/composables/useApp';

const authStore = useAuthStore();
const themeClass = useThemeClass();
const wallet = ref<BillingWallet | null>(null);
const packages = ref<BillingPackage[]>([]);
const orders = ref<BillingOrder[]>([]);
const paymentChannels = ref<BillingPaymentChannel[]>([]);

const permissions = computed(() => authStore.user?.permissions || []);
const canManageBilling = computed(() => hasPermission(permissions.value, 'billing:manage'));
const canPayBilling = computed(() => hasPermission(permissions.value, 'billing:pay'));
const pendingOrders = computed(() => orders.value.filter((o) => o.pay_status !== 1));

function ensureBillingAccess(): boolean {
  return ensurePermission('billing:view', '无权访问计费中心');
}

async function loadAll() {
  const [w, p, o, ch] = await Promise.all([
    billingWallet(),
    billingPackages(),
    billingOrders({ page: 1, page_size: 20 }),
    billingPaymentChannels(),
  ]);
  wallet.value = w;
  packages.value = p;
  orders.value = o.list;
  paymentChannels.value = ch;
  uni.stopPullDownRefresh();
}

async function buy(packageId: number, period: 'monthly' | 'yearly') {
  const order = await createBillingOrder({ order_type: 1, package_id: packageId, period });
  toastSuccess(`订单已创建 ${order.order_no}`);
  await loadAll();
}

async function pay(orderId: number, channel: string) {
  const payment = await payBillingOrder(orderId, channel);
  if ((payment as { mock?: boolean }).mock) {
    await confirmPayment(payment.payment_no);
    toastSuccess('支付成功');
  } else if (payment.pay_url?.startsWith('http')) {
    // #ifdef H5
    window.open(payment.pay_url, '_blank');
    // #endif
    toastSuccess('已打开收银台，支付完成后请下拉刷新');
  } else {
    toastSuccess(`请完成支付：${payment.payment_no}`);
  }
  await loadAll();
}

onShow(() => {
  if (!ensureBillingAccess()) return;
  loadAll();
});
onPullDownRefresh(() => {
  if (!ensureBillingAccess()) {
    uni.stopPullDownRefresh();
    return;
  }
  loadAll();
});
</script>

<style scoped lang="scss">
.billing-page {
  min-height: 100vh;
}

.scroll-body {
  height: calc(100vh - 44px);
}

.package-row {
  display: flex;
  justify-content: space-between;
  padding: 12px 16px;
  border-top: 1px solid var(--cs-divider);
}

.package-row__name {
  display: block;
  font-weight: 600;
}

.package-row__quota {
  display: block;
  font-size: 12px;
  color: var(--cs-text-muted);
  margin-top: 4px;
}

.package-row__actions {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.mini-btn {
  padding: 4px 12px;
  font-size: 12px;
}

.order-row {
  padding: 12px 16px;
  border-top: 1px solid var(--cs-divider);
}

.order-row__head {
  display: flex;
  justify-content: space-between;
}

.order-row__amount {
  color: var(--cs-danger);
  font-weight: 700;
}

.order-row__type {
  display: block;
  margin-top: 4px;
  font-size: 13px;
  color: var(--cs-text-secondary);
}

.order-row__channels {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}
</style>
