<template>
  <view class="chat-card chat-card--product">
    <view v-if="picUrl" class="chat-card__thumb">
      <image :src="picUrl" mode="aspectFill" class="chat-card__image" />
    </view>
    <view v-else class="chat-card__thumb chat-card__thumb--placeholder">
      <text>商</text>
    </view>
    <view class="chat-card__body">
      <text class="chat-card__badge">商品卡片</text>
      <text class="chat-card__title">{{ displayTitle }}</text>
      <view class="chat-card__meta">
        <text v-if="data.product_id">ID: {{ data.product_id }}</text>
        <text v-if="data.sku_id">SKU: {{ data.sku_id }}</text>
        <text v-if="priceText" class="chat-card__price">{{ priceText }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { ProductCardData } from '@/utils/messageCard';
import { formatPrice, resolveMediaUrl } from '@/utils/messageCard';

const props = defineProps<{
  data: ProductCardData;
  fallback?: string;
}>();

const picUrl = computed(() => resolveMediaUrl(props.data.pic_url));
const priceText = computed(() => formatPrice(props.data.price));
const displayTitle = computed(() => props.data.title || props.fallback || '买家咨询的商品');
</script>
