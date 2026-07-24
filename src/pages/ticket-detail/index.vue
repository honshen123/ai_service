<template>
  <view class="page-with-nav" :class="themeClass">
    <scroll-view scroll-y class="scroll-body">
      <view v-if="detail" class="detail-head card-block">
        <view class="detail-head__row">
          <text class="badge-ticket" :class="'badge-ticket--' + ticketStatusType(detail.ticket.status)">{{ ticketStatusText(detail.ticket.status) }}</text>
          <text>{{ ticketPriorityText(detail.ticket.priority) }}优先级</text>
        </view>
        <text class="detail-head__title">{{ detail.ticket.title }}</text>
        <text class="detail-head__content">{{ detail.ticket.content || '暂无描述' }}</text>
        <button v-if="detail.ticket.status !== 3" class="btn-primary mini-btn" @tap="resolve">标记解决</button>
      </view>
      <view v-if="detail" class="card-block">
        <text class="section-title">评论记录</text>
        <view v-for="item in detail.comments" :key="item.id" class="comment-item">
          <text class="comment-item__meta">用户 #{{ item.user_id }} · {{ item.create_time || '' }}</text>
          <text class="comment-item__content">{{ item.content }}</text>
        </view>
        <view v-if="detail.comments.length === 0" class="empty-box">暂无评论</view>
      </view>
      <view v-if="detail" class="card-block">
        <text class="section-title">流转记录</text>
        <view v-for="flow in detail.flows" :key="flow.id" class="comment-item">
          <text class="comment-item__meta">{{ flow.action }} · {{ flow.create_time || '' }}</text>
          <text class="comment-item__content">{{ flow.remark || '—' }}</text>
        </view>
      </view>
    </scroll-view>
    <view class="comment-bar">
      <input v-model="commentText" class="input-round" placeholder="添加评论..." />
      <button class="btn-primary mini-btn" @tap="submitComment">发送</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { addTicketComment, ticketDetail, updateTicketStatus } from '@/api/tenant';
import type { TicketDetailResult } from '@/types/api';
import { ticketPriorityText, ticketStatusText, ticketStatusType } from '@/utils/session';
import { toastSuccess, useThemeClass } from '@/composables/useApp';

const themeClass = useThemeClass();
const ticketId = ref(0);
const detail = ref<TicketDetailResult | null>(null);
const commentText = ref('');

async function loadDetail() {
  detail.value = await ticketDetail(ticketId.value);
}

async function resolve() {
  await updateTicketStatus(ticketId.value, 3);
  toastSuccess('已标记解决');
  await loadDetail();
}

async function submitComment() {
  const content = commentText.value.trim();
  if (!content) return;
  await addTicketComment(ticketId.value, content);
  commentText.value = '';
  toastSuccess('评论已添加');
  await loadDetail();
}

onLoad((options) => {
  ticketId.value = Number(options?.id || 0);
  if (ticketId.value) loadDetail();
});
</script>

<style scoped lang="scss">
.scroll-body { height: calc(100vh - 60px); padding-bottom: 72px; }
.detail-head { padding: 16px; }
.detail-head__row { display: flex; gap: 10px; align-items: center; font-size: 12px; color: var(--cs-text-muted); }
.detail-head__title { display: block; margin-top: 10px; font-size: 18px; font-weight: 700; }
.detail-head__content { display: block; margin-top: 8px; font-size: 14px; color: var(--cs-text-secondary); line-height: 1.5; }
.mini-btn { margin-top: 12px; padding: 6px 16px; font-size: 13px; }
.comment-item { padding: 10px 16px; border-top: 1px solid var(--cs-divider); }
.comment-item__meta { display: block; font-size: 11px; color: var(--cs-text-muted); }
.comment-item__content { display: block; margin-top: 4px; font-size: 14px; }
</style>
