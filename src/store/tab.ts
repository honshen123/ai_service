import { defineStore } from 'pinia';
import { hasPermission } from '@/utils/permission';

export type TabIconName = 'workbench' | 'message' | 'ticket' | 'stats' | 'profile';

export interface TabItem {
  pagePath: string;
  text: string;
  icon: TabIconName;
  badge?: boolean;
  /** 与 PC 端 WorkspaceLayout 菜单权限一致 */
  permission?: string;
}

export const TAB_ITEMS: TabItem[] = [
  { pagePath: '/pages/messages/index', text: '工作台', icon: 'workbench', permission: 'session:view' },
  { pagePath: '/pages/tickets/index', text: '工单', icon: 'ticket', permission: 'ticket:view' },
  { pagePath: '/pages/notifications/index', text: '消息', icon: 'message', badge: true, permission: 'session:view' },
  { pagePath: '/pages/statistics/index', text: '数据', icon: 'stats', permission: 'statistics:view' },
  { pagePath: '/pages/profile/index', text: '我的', icon: 'profile' },
];

export function getVisibleTabs(permissions: string[] | undefined): TabItem[] {
  return TAB_ITEMS.filter((t) => !t.permission || hasPermission(permissions, t.permission));
}

export function getDefaultTabPath(permissions: string[] | undefined): string {
  const visible = getVisibleTabs(permissions);
  return visible[0]?.pagePath ?? '/pages/profile/index';
}

function resolveTabPath(route?: string): string {
  if (!route) return TAB_ITEMS[0].pagePath;
  const normalized = route.startsWith('/') ? route : `/${route}`;
  const hit = TAB_ITEMS.find(
    (t) => t.pagePath === normalized || t.pagePath.replace(/^\//, '') === route,
  );
  return hit?.pagePath ?? TAB_ITEMS[0].pagePath;
}

export const useTabStore = defineStore('mobile-tab', {
  state: () => ({
    activePath: TAB_ITEMS[0].pagePath,
  }),
  actions: {
    syncActivePath() {
      const pages = getCurrentPages();
      const page = pages[pages.length - 1] as { route?: string } | undefined;
      this.activePath = resolveTabPath(page?.route);
    },
    setActivePath(path: string) {
      this.activePath = path;
    },
  },
});
