<template>
  <view class="chat-card chat-card--order">
    <view class="chat-card__icon-wrap">
      <text>单</text>
    </view>
    <view class="chat-card__body">
      <text class="chat-card__badge">订单卡片</text>
      <text class="chat-card__title">{{ displayTitle }}</text>
      <view class="chat-card__meta">
        <text v-if="data.order_no">订单号: {{ data.order_no }}</text>
        <text v-if="data.status">状态: {{ data.status }}</text>
        <text v-if="amountText" class="chat-card__price">{{ amountText }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { OrderCardData } from '@/utils/messageCard';
import { formatPrice } from '@/utils/messageCard';

const props = defineProps<{
  data: OrderCardData;
  fallback?: string;
}>();

const amountText = computed(() => formatPrice(props.data.amount));
const displayTitle = computed(() => {
  if (props.data.title) return props.data.title;
  if (props.data.order_no) return `订单 ${props.data.order_no}`;
  return props.fallback || '买家咨询的订单';
});
</script>
