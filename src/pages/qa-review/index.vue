<template>
  <view class="page page-with-nav qa-review-page" :class="themeClass">
    <scroll-view scroll-y class="scroll-body" @scrolltolower="loadMore">
      <view v-for="item in items" :key="item.id" class="review-card">
        <view class="review-card__head">
          <view class="review-card__score">
            <text class="review-card__score-value">{{ item.ai_score.toFixed(1) }}</text>
            <text class="review-card__score-label">质检分</text>
          </view>
          <view class="review-card__meta">
            <text class="review-card__tag">{{ item.status_label }}</text>
            <text>会话 #{{ item.session_id }}</text>
            <text v-if="item.create_time">{{ item.create_time }}</text>
          </view>
        </view>

        <view class="qa-block">
          <text class="qa-block__label">客户问题</text>
          <text class="qa-block__content">{{ item.qa_question || '—' }}</text>
        </view>
        <view class="qa-block">
          <text class="qa-block__label">AI 回答</text>
          <text class="qa-block__content">{{ item.qa_answer || '—' }}</text>
        </view>

        <text v-if="item.feedback" class="review-card__feedback">{{ item.feedback }}</text>

        <view v-if="canManageReview" class="review-card__actions">
          <button
            class="btn-primary mini-btn"
            :disabled="actingId === item.id"
            @tap="approve(item)"
          >
            通过并入库
          </button>
          <button
            class="btn-plain mini-btn"
            :disabled="actingId === item.id"
            @tap="openReject(item)"
          >
            驳回
          </button>
        </view>
      </view>

      <view v-if="!loading && items.length === 0" class="empty-box">暂无待审核 QA</view>
      <view v-if="loading" class="empty-box">加载中…</view>
      <view v-if="!loading && finished && items.length > 0" class="empty-box">没有更多了</view>
    </scroll-view>

    <view v-if="rejectVisible" class="popup-mask" @tap="rejectVisible = false">
      <view class="popup-panel" @tap.stop>
        <text class="popup-panel__title">驳回 QA</text>
        <textarea v-model="rejectReason" class="form-field__textarea" placeholder="可选：填写驳回原因" />
        <view class="popup-panel__actions">
          <button class="btn-plain mini-btn" @tap="rejectVisible = false">取消</button>
          <button class="btn-danger-plain mini-btn" :disabled="actingId !== null" @tap="confirmReject">确认驳回</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { onPullDownRefresh, onShow } from '@dcloudio/uni-app';
import { approveQualityCheck, qualityPending, rejectQualityCheck } from '@/api/tenant';
import type { QualityCheckItem } from '@/types/api';
import { ensurePermission } from '@/composables/useAccessGuard';
import { toastSuccess, useThemeClass } from '@/composables/useApp';
import { usePermissions } from '@/composables/usePermissions';
import { getAccessToken } from '@/store/auth';

const themeClass = useThemeClass();
const { canManageReview } = usePermissions();

const items = ref<QualityCheckItem[]>([]);
const page = ref(1);
const pageSize = 10;
const total = ref(0);
const loading = ref(false);
const finished = ref(false);
const actingId = ref<number | null>(null);
const rejectVisible = ref(false);
const rejectTarget = ref<QualityCheckItem | null>(null);
const rejectReason = ref('');

async function load(reset = false) {
  if (loading.value) return;
  if (reset) {
    page.value = 1;
    finished.value = false;
    items.value = [];
  }
  if (finished.value) return;

  loading.value = true;
  try {
    const result = await qualityPending({ page: page.value, page_size: pageSize });
    total.value = result.total;
    if (reset) {
      items.value = result.list;
    } else {
      items.value = [...items.value, ...result.list];
    }
    if (items.value.length >= result.total || result.list.length < pageSize) {
      finished.value = true;
    } else {
      page.value += 1;
    }
  } catch {
    if (reset) items.value = [];
  } finally {
    loading.value = false;
  }
}

function loadMore() {
  if (!finished.value) load(false);
}

async function approve(item: QualityCheckItem) {
  actingId.value = item.id;
  try {
    await approveQualityCheck(item.id);
    toastSuccess('已通过并入库');
    await load(true);
  } finally {
    actingId.value = null;
  }
}

function openReject(item: QualityCheckItem) {
  rejectTarget.value = item;
  rejectReason.value = '';
  rejectVisible.value = true;
}

async function confirmReject() {
  if (!rejectTarget.value) return;
  actingId.value = rejectTarget.value.id;
  try {
    await rejectQualityCheck(rejectTarget.value.id, rejectReason.value.trim());
    toastSuccess('已驳回');
    rejectVisible.value = false;
    await load(true);
  } finally {
    actingId.value = null;
  }
}

onShow(async () => {
  if (!getAccessToken()) {
    uni.reLaunch({ url: '/pages/login/index' });
    return;
  }
  if (!ensurePermission('quality:view')) return;
  await load(true);
});

onPullDownRefresh(async () => {
  await load(true);
  uni.stopPullDownRefresh();
});
</script>

<style scoped lang="scss">
.qa-review-page {
  padding: 12px;
}

.review-card {
  margin-bottom: 12px;
  padding: 14px;
  background: var(--cs-bg-elevated);
  border-radius: var(--cs-radius-lg);
  border: 1px solid var(--cs-divider);
}

.review-card__head {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
}

.review-card__score {
  width: 56px;
  text-align: center;
  flex-shrink: 0;
}

.review-card__score-value {
  display: block;
  font-size: 20px;
  font-weight: 700;
  color: var(--cs-primary);
}

.review-card__score-label {
  display: block;
  font-size: 11px;
  color: var(--cs-text-muted);
}

.review-card__meta {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 12px;
  color: var(--cs-text-muted);
}

.review-card__tag {
  align-self: flex-start;
  padding: 2px 8px;
  border-radius: var(--cs-radius-full);
  background: var(--cs-warning-soft, rgba(255, 125, 0, 0.12));
  color: var(--cs-warning);
  font-size: 11px;
}

.qa-block {
  margin-bottom: 10px;
}

.qa-block__label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: var(--cs-text-muted);
  margin-bottom: 4px;
}

.qa-block__content {
  display: block;
  font-size: 14px;
  color: var(--cs-text-primary);
  line-height: 1.5;
  white-space: pre-wrap;
}

.review-card__feedback {
  display: block;
  margin-bottom: 10px;
  font-size: 12px;
  color: var(--cs-text-muted);
}

.review-card__actions {
  display: flex;
  gap: 8px;
  margin-top: 4px;
}

.popup-panel__actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 12px;
}
</style>
