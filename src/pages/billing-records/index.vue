<template>
  <view class="page page-with-nav billing-records-page" :class="themeClass">
    <view class="filter-bar">
      <scroll-view scroll-x class="filter-scroll">
        <text
          v-for="chip in typeFilters"
          :key="chip.value"
          class="filter-chip"
          :class="{ 'filter-chip--active': balanceField === chip.value }"
          @tap="setBalanceField(chip.value)"
        >{{ chip.label }}</text>
      </scroll-view>
      <scroll-view scroll-x class="filter-scroll">
        <text
          v-for="chip in directionFilters"
          :key="chip.value"
          class="filter-chip"
          :class="{ 'filter-chip--active': direction === chip.value }"
          @tap="setDirection(chip.value)"
        >{{ chip.label }}</text>
      </scroll-view>
    </view>

    <scroll-view scroll-y class="scroll-body" @scrolltolower="loadMore">
      <view v-for="row in rows" :key="row.id" class="record-card">
        <view class="record-card__head">
          <text class="record-card__no">{{ row.billing_no }}</text>
          <text
            class="record-card__amount"
            :class="row.direction === 'credit' ? 'record-card__amount--credit' : 'record-card__amount--consume'"
          >
            {{ row.direction === 'credit' ? '+' : '-' }}{{ formatNumber(row.change_amount) }}
          </text>
        </view>
        <view class="record-card__meta">
          <text>{{ balanceFieldText(row.balance_field) }}</text>
          <text>{{ row.direction === 'credit' ? '充值' : '消费' }}</text>
          <text>{{ refTypeText(row.ref_type) }}</text>
        </view>
        <view class="record-card__balance">
          余额 {{ formatNumber(row.balance_before) }} → {{ formatNumber(row.balance_after) }}
        </view>
        <text v-if="row.remark" class="record-card__remark">{{ row.remark }}</text>
        <text v-if="row.create_time" class="record-card__time">{{ row.create_time }}</text>
      </view>

      <view v-if="!loading && rows.length === 0" class="empty-box">暂无流水</view>
      <view v-if="loading" class="empty-box">加载中…</view>
      <view v-if="!loading && finished && rows.length > 0" class="empty-box">没有更多了</view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { onPullDownRefresh, onShow } from '@dcloudio/uni-app';
import { billingRecords } from '@/api/tenant';
import type { BillingRecordItem } from '@/types/api';
import { ensurePermission } from '@/composables/useAccessGuard';
import { useThemeClass } from '@/composables/useApp';
import { formatNumber } from '@/utils/session';
import { getAccessToken } from '@/store/auth';

const themeClass = useThemeClass();

const rows = ref<BillingRecordItem[]>([]);
const page = ref(1);
const pageSize = 20;
const loading = ref(false);
const finished = ref(false);
const balanceField = ref('');
const direction = ref('');

const typeFilters = [
  { label: '全部类型', value: '' },
  { label: 'Token', value: 'token_balance' },
  { label: '消息', value: 'message_balance' },
];

const directionFilters = [
  { label: '全部方向', value: '' },
  { label: '充值', value: 'credit' },
  { label: '消费', value: 'consume' },
];

function balanceFieldText(field: string): string {
  return (
    {
      token_balance: 'Token',
      message_balance: '消息',
      seat_limit: '席位',
      shop_limit: '店铺',
    }[field] || field || '-'
  );
}

function refTypeText(refType: string): string {
  return (
    {
      order: '订单',
      ai_precharge: 'AI 预扣',
      ai_settle: 'AI 结算',
      ai_rollback: 'AI 退回',
    }[refType] || refType || '-'
  );
}

function setBalanceField(value: string) {
  balanceField.value = value;
  load(true);
}

function setDirection(value: string) {
  direction.value = value;
  load(true);
}

function buildParams(p: number): Record<string, string | number> {
  const params: Record<string, string | number> = {
    page: p,
    page_size: pageSize,
  };
  if (balanceField.value) params.balance_field = balanceField.value;
  if (direction.value) params.direction = direction.value;
  return params;
}

async function load(reset = false) {
  if (loading.value) return;
  if (reset) {
    page.value = 1;
    finished.value = false;
    rows.value = [];
  }
  if (finished.value) return;

  loading.value = true;
  try {
    const result = await billingRecords(buildParams(page.value));
    if (reset) {
      rows.value = result.list;
    } else {
      rows.value = [...rows.value, ...result.list];
    }
    if (rows.value.length >= result.total || result.list.length < pageSize) {
      finished.value = true;
    } else {
      page.value += 1;
    }
  } catch {
    if (reset) rows.value = [];
  } finally {
    loading.value = false;
  }
}

function loadMore() {
  if (!finished.value) load(false);
}

onShow(async () => {
  if (!getAccessToken()) {
    uni.reLaunch({ url: '/pages/login/index' });
    return;
  }
  if (!ensurePermission('billing:view')) return;
  await load(true);
});

onPullDownRefresh(async () => {
  await load(true);
  uni.stopPullDownRefresh();
});
</script>

<style scoped lang="scss">
.billing-records-page {
  padding: 12px;
}

.filter-bar {
  margin-bottom: 12px;
}

.filter-scroll {
  white-space: nowrap;
  margin-bottom: 8px;
}

.filter-chip {
  display: inline-block;
  margin-right: 8px;
  padding: 6px 12px;
  border-radius: var(--cs-radius-full);
  font-size: 13px;
  color: var(--cs-text-muted);
  background: var(--cs-bg-elevated);
  border: 1px solid var(--cs-divider);

  &--active {
    color: var(--cs-primary);
    border-color: var(--cs-primary);
    background: var(--cs-primary-soft);
  }
}

.record-card {
  margin-bottom: 10px;
  padding: 14px;
  background: var(--cs-bg-elevated);
  border-radius: var(--cs-radius-lg);
  border: 1px solid var(--cs-divider);
}

.record-card__head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 8px;
}

.record-card__no {
  flex: 1;
  font-size: 13px;
  color: var(--cs-text-primary);
  word-break: break-all;
}

.record-card__amount {
  font-size: 16px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;

  &--credit {
    color: var(--cs-success, #00b42a);
  }

  &--consume {
    color: var(--cs-warning);
  }
}

.record-card__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
  font-size: 12px;
  color: var(--cs-text-muted);
}

.record-card__balance {
  margin-top: 6px;
  font-size: 12px;
  color: var(--cs-text-secondary, var(--cs-text-muted));
}

.record-card__remark {
  display: block;
  margin-top: 6px;
  font-size: 12px;
  color: var(--cs-text-muted);
}

.record-card__time {
  display: block;
  margin-top: 6px;
  font-size: 11px;
  color: var(--cs-text-muted);
}
</style>
