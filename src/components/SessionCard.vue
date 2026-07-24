<template>

  <view class="session-card" :class="{ 'session-card--urgent': session.priority > 0 }" @tap="$emit('click')">

    <view class="session-card__avatar">

      <image v-if="avatarUrl" :src="avatarUrl" mode="aspectFill" class="session-card__avatar-img" />

      <text v-else class="session-card__avatar-text">{{ avatarText }}</text>

      <view v-if="session.ai_blocked === 1" class="session-card__dot session-card__dot--danger" />

      <view v-else-if="session.hosting_mode === 0" class="session-card__dot session-card__dot--manual" />

    </view>

    <view class="session-card__body">

      <view class="session-card__top">

        <text class="session-card__name">{{ session.customer_nickname || '未知客户' }}</text>

        <text class="session-card__time">{{ formatRelativeTime(session.last_message_time) }}</text>

      </view>

      <text v-if="previewText" class="session-card__preview">{{ previewText }}</text>

      <view class="session-card__meta">

        <text class="session-card__platform">{{ platformLabel(session.platform) }}</text>

        <text v-if="session.shop_name" class="session-card__sep">·</text>

        <text v-if="session.shop_name" class="session-card__shop">{{ session.shop_name }}</text>

        <view class="session-card__badges">

          <text class="badge-hosting" :class="'badge-hosting--' + hostingModeType(session.hosting_mode)">

            {{ hostingModeText(session.hosting_mode) }}

          </text>

        </view>

      </view>

    </view>

  </view>

</template>



<script setup lang="ts">

import { computed } from 'vue';

import type { SessionItem } from '@/types/api';

import { formatRelativeTime, hostingModeText, hostingModeType, platformLabel } from '@/utils/session';

import { resolveMediaUrl } from '@/utils/messageCard';



const props = defineProps<{ session: SessionItem }>();

defineEmits<{ click: [] }>();



const avatarText = computed(() => {

  const name = props.session.customer_nickname || '?';

  return name.slice(0, 1).toUpperCase();

});



const avatarUrl = computed(() => resolveMediaUrl(props.session.customer_avatar));



const previewText = computed(() => props.session.session_summary?.trim() || '');

</script>



<style scoped lang="scss">

.session-card {

  display: flex;

  align-items: flex-start;

  gap: 12px;

  padding: 14px 16px;

  background: var(--cs-bg-elevated);

  border-bottom: 1px solid var(--cs-divider);

  position: relative;



  &:active {

    background: var(--cs-bg-subtle);

  }



  &:last-child {

    border-bottom: none;

  }

}



.session-card--urgent .session-card__name {

  color: var(--cs-danger);

}



.session-card__avatar {

  position: relative;

  flex-shrink: 0;

  width: 44px;

  height: 44px;

  border-radius: 50%;

  background: var(--cs-primary-soft);

  display: flex;

  align-items: center;

  justify-content: center;

  overflow: hidden;

}



.session-card__avatar-text {

  font-size: 16px;

  font-weight: 600;

  color: var(--cs-primary);

}



.session-card__avatar-img {

  width: 100%;

  height: 100%;

}



.session-card__dot {

  position: absolute;

  right: 0;

  bottom: 0;

  width: 10px;

  height: 10px;

  border-radius: 50%;

  border: 2px solid var(--cs-bg-elevated);

}



.session-card__dot--manual { background: var(--cs-warning); }

.session-card__dot--danger { background: var(--cs-danger); }



.session-card__body {

  flex: 1;

  min-width: 0;

}



.session-card__top {

  display: flex;

  justify-content: space-between;

  align-items: center;

  gap: 8px;

}



.session-card__name {

  font-size: 15px;

  font-weight: 500;

  color: var(--cs-text-primary);

  overflow: hidden;

  text-overflow: ellipsis;

  white-space: nowrap;

  flex: 1;

}



.session-card__time {

  font-size: 12px;

  color: var(--cs-text-muted);

  flex-shrink: 0;

  font-variant-numeric: tabular-nums;

}



.session-card__preview {

  display: block;

  margin-top: 4px;

  font-size: 13px;

  color: var(--cs-text-muted);

  overflow: hidden;

  text-overflow: ellipsis;

  white-space: nowrap;

  line-height: 1.4;

}



.session-card__meta {

  display: flex;

  align-items: center;

  flex-wrap: wrap;

  gap: 4px;

  margin-top: 6px;

  font-size: 12px;

  color: var(--cs-text-muted);

}



.session-card__platform,

.session-card__shop {

  font-size: 12px;

  color: var(--cs-text-muted);

}



.session-card__shop {

  overflow: hidden;

  text-overflow: ellipsis;

  white-space: nowrap;

  max-width: 100px;

}



.session-card__sep {

  color: var(--cs-text-muted);

}



.session-card__badges {

  margin-left: auto;

  flex-shrink: 0;

}

</style>


