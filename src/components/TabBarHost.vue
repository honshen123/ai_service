<template>
  <!-- H5 内嵌自定义 TabBar；小程序走 custom-tab-bar/index.vue -->
  <!-- #ifdef H5 -->
  <AppTabBar />
  <!-- #endif -->
</template>

<script setup lang="ts">
import AppTabBar from '@/components/AppTabBar.vue';
</script>

