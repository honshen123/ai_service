<script setup lang="ts">
import { onLaunch, onShow } from '@dcloudio/uni-app';
import { useThemeStore } from '@/store/theme';
import { initTabBar } from '@/composables/useTabBar';

onLaunch(() => {
  useThemeStore().init();
  initTabBar();
});

onShow(() => {
  initTabBar();
});
</script>

<style lang="scss">
@import '@/styles/global.scss';
</style>
