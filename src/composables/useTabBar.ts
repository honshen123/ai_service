import { useTabStore } from '@/store/tab';
import { initNotificationPolling } from '@/composables/useNotificationPolling';



/** 隐藏原生 TabBar，使用自定义底部导航（支持主题与 CSS 图标） */

export function hideNativeTabBar() {

  try {

    uni.hideTabBar({ animation: false, fail: () => {} });

  } catch {

    // ignore

  }

}



export function initTabBar() {

  hideNativeTabBar();

  useTabStore().syncActivePath();

  initNotificationPolling();

}



export const TAB_BAR_HEIGHT = 52;


