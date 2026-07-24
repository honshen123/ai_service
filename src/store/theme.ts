import { defineStore } from 'pinia';
import { getStorage, setStorage } from '@/utils/storage';

const THEME_KEY = 'aics.mobile.theme';

export type ThemeMode = 'light' | 'dark';

function readTheme(): ThemeMode {
  const saved = getStorage(THEME_KEY);
  if (saved === 'dark' || saved === 'light') {
    return saved;
  }
  return 'light';
}

function applyTheme(mode: ThemeMode): void {
  // #ifdef H5
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', mode);
    document.documentElement.style.colorScheme = mode;
  }
  // #endif
}

export const useThemeStore = defineStore('mobile-theme', {
  state: () => ({
    mode: readTheme() as ThemeMode,
  }),
  getters: {
    isDark: (state) => state.mode === 'dark',
    themeClass: (state) => (state.mode === 'dark' ? 'theme-dark' : 'theme-light'),
  },
  actions: {
    init() {
      applyTheme(this.mode);
    },
    setMode(mode: ThemeMode) {
      this.mode = mode;
      setStorage(THEME_KEY, mode);
      applyTheme(mode);
      // 主题切换后刷新 TabBar 选中态（自定义 TabBar 通过 themeClass 自动换色）
      try {
        uni.hideTabBar({ animation: false, fail: () => {} });
      } catch {
        // ignore
      }
    },
    toggle() {
      this.setMode(this.mode === 'dark' ? 'light' : 'dark');
    },
  },
});
