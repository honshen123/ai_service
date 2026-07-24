<template>
  <view />
</template>

<script setup lang="ts">
import { onShow } from '@dcloudio/uni-app';

/** 兼容旧入口：系统设置已整合至 AI 设置 → 审核设置 */
onShow(() => {
  uni.redirectTo({ url: '/pages/ai-settings/index?tab=review' });
});
</script>
