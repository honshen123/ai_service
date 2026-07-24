import { getAccessToken, useAuthStore } from '@/store/auth';
import { hasPermission, isTenantAdmin } from '@/utils/permission';
import { getDefaultTabPath } from '@/store/tab';
import { toast } from '@/composables/useApp';

export function ensureLoggedIn(): boolean {
  if (!getAccessToken()) {
    uni.reLaunch({ url: '/pages/login/index' });
    return false;
  }
  return true;
}

export function redirectToAccessibleTab(): void {
  const authStore = useAuthStore();
  const path = getDefaultTabPath(authStore.user?.permissions ?? []);
  uni.switchTab({
    url: path,
    fail: () => {
      uni.reLaunch({ url: '/pages/profile/index' });
    },
  });
}

export function ensurePermission(code: string, message = '无权访问'): boolean {
  if (!ensureLoggedIn()) return false;
  const authStore = useAuthStore();
  if (!hasPermission(authStore.user?.permissions, code)) {
    toast(message);
    redirectToAccessibleTab();
    return false;
  }
  return true;
}

export function ensureTenantAdmin(message = '仅租户管理员可访问'): boolean {
  if (!ensureLoggedIn()) return false;
  const authStore = useAuthStore();
  if (!isTenantAdmin(authStore.user?.permissions, authStore.user?.is_tenant_admin)) {
    toast(message);
    redirectToAccessibleTab();
    return false;
  }
  return true;
}

/** 与 PC 路由 system-settings 一致：租户管理员 + quality:manage */
export function ensureSystemSettings(): boolean {
  if (!ensureTenantAdmin()) return false;
  const authStore = useAuthStore();
  if (!hasPermission(authStore.user?.permissions, 'quality:manage')) {
    toast('无权访问系统设置');
    redirectToAccessibleTab();
    return false;
  }
  return true;
}

/** 与 PC 路由 ai-settings 一致：任一 AI 管理权限，或租户管理员 + quality:manage（审核设置） */
export function ensureAiSettings(): boolean {
  if (!ensureLoggedIn()) return false;
  const authStore = useAuthStore();
  const perms = authStore.user?.permissions;
  const hasAiPerm =
    hasPermission(perms, 'ai:model:manage')
    || hasPermission(perms, 'ai:prompt:manage')
    || hasPermission(perms, 'ai:sensitive:manage');
  const hasReviewPerm = isTenantAdmin(perms, authStore.user?.is_tenant_admin)
    && hasPermission(perms, 'quality:manage');
  if (!hasAiPerm && !hasReviewPerm) {
    toast('无权访问 AI 设置');
    redirectToAccessibleTab();
    return false;
  }
  return true;
}
