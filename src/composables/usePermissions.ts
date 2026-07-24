import { computed } from 'vue';
import { useAuthStore } from '@/store/auth';
import { hasPermission, isTenantAdmin as checkTenantAdmin } from '@/utils/permission';

export function usePermissions() {
  const authStore = useAuthStore();
  const permissions = computed(() => authStore.user?.permissions ?? []);

  function canView(code: string): boolean {
    return hasPermission(permissions.value, code);
  }

  const isTenantAdmin = computed(() =>
    checkTenantAdmin(permissions.value, authStore.user?.is_tenant_admin),
  );

  const canManageAgents = computed(() => canView('user:manage'));

  const canManageModels = computed(() => canView('ai:model:manage'));
  const canManagePrompts = computed(() => canView('ai:prompt:manage'));
  const canManageSensitive = computed(() => canView('ai:sensitive:manage'));
  const canManageReview = computed(() => isTenantAdmin.value && canView('quality:manage'));

  const canManageAiSettings = computed(() =>
    canManageModels.value || canManagePrompts.value || canManageSensitive.value || canManageReview.value,
  );

  return {
    permissions,
    canView,
    isTenantAdmin,
    canManageAgents,
    canManageAiSettings,
    canManageModels,
    canManagePrompts,
    canManageSensitive,
    canManageReview,
  };
}
