<template>
  <AppTabBar />
</template>

<script setup lang="ts">
import { onShow } from '@dcloudio/uni-app';
import AppTabBar from '@/components/AppTabBar.vue';
import { initTabBar } from '@/composables/useTabBar';

onShow(() => {
  initTabBar();
});
</script>
