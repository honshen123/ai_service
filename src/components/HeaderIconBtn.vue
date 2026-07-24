<template>
  <view
    class="header-icon-btn"
    :class="isDark ? 'header-icon-btn--on-dark' : 'header-icon-btn--on-light'"
    @tap="emit('tap')"
  >
    <slot />
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useThemeStore } from '@/store/theme';

const emit = defineEmits<{ tap: [] }>();
const themeStore = useThemeStore();
const isDark = computed(() => themeStore.isDark);
</script>

<style scoped lang="scss">
.header-icon-btn {
  width: 30px;
  height: 30px;
  border-radius: var(--cs-radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: transform 0.16s ease, background 0.16s ease, border-color 0.16s ease;

  &:active {
    transform: scale(0.94);
  }
}

.header-icon-btn--on-light {
  background: #f2f3f5;
  border: 1px solid #e5e6eb;
  color: #1f2329;
  box-shadow: 0 1px 2px rgba(31, 35, 41, 0.04);

  &:active {
    background: #e5e6eb;
  }
}

.header-icon-btn--on-dark {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.92);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);

  &:active {
    background: rgba(255, 255, 255, 0.14);
  }
}

:deep(.header-icon-btn__svg) {
  width: 15px;
  height: 15px;
  display: block;
}
</style>
