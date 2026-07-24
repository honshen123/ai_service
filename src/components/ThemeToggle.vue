<template>
  <HeaderIconBtn @tap="onToggle">
    <!-- 浅色模式：显示太阳，点击切换为深色 -->
    <svg
      v-if="!isDark"
      class="header-icon-btn__svg"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="4" stroke="currentColor" stroke-width="1.75" />
      <path
        d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
        stroke="currentColor"
        stroke-width="1.75"
        stroke-linecap="round"
      />
    </svg>

    <!-- 深色模式：显示月亮，点击切换为浅色 -->
    <svg
      v-else
      class="header-icon-btn__svg header-icon-btn__svg--moon"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
        stroke="currentColor"
        stroke-width="1.75"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  </HeaderIconBtn>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import HeaderIconBtn from '@/components/HeaderIconBtn.vue';
import { useThemeStore } from '@/store/theme';

const themeStore = useThemeStore();
const isDark = computed(() => themeStore.isDark);

function onToggle() {
  themeStore.toggle();
}
</script>

<style scoped lang="scss">
.header-icon-btn__svg--moon {
  transform: rotate(-12deg);
}
</style>
