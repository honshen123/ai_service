import { computed } from 'vue';
import { useThemeStore } from '@/store/theme';

/** 页面根节点主题 class */
export function useThemeClass() {
  const themeStore = useThemeStore();
  return computed(() => themeStore.themeClass);
}

/** 路由跳转封装 */
export function goChat(sessionId: number) {
  uni.navigateTo({ url: `/pages/chat/index?sessionId=${sessionId}` });
}

export function goTicketDetail(id: number) {
  uni.navigateTo({ url: `/pages/ticket-detail/index?id=${id}` });
}

export function goKnowledge() {
  uni.navigateTo({ url: '/pages/knowledge/index' });
}

export function goPlatforms() {
  uni.navigateTo({ url: '/pages/platforms/index' });
}

export function goBilling() {
  uni.navigateTo({ url: '/pages/billing/index' });
}

export function goBillingRecords() {
  uni.navigateTo({ url: '/pages/billing-records/index' });
}

export function goQaReview() {
  uni.navigateTo({ url: '/pages/qa-review/index' });
}

export function goAgents() {
  uni.navigateTo({ url: '/pages/agents/index' });
}

export function goSystemSettings() {
  goAiSettings('review');
}

export function goAiSettings(tab?: 'models' | 'prompts' | 'sensitive' | 'review') {
  const query = tab ? `?tab=${tab}` : '';
  uni.navigateTo({ url: `/pages/ai-settings/index${query}` });
}

export function goProfileSettings() {
  uni.navigateTo({ url: '/pages/profile/settings/index' });
}

export function toast(title: string) {
  uni.showToast({ title, icon: 'none' });
}

export function toastSuccess(title: string) {
  uni.showToast({ title, icon: 'success' });
}

export async function confirm(title: string, content: string): Promise<boolean> {
  return new Promise((resolve) => {
    uni.showModal({
      title,
      content,
      success: (res) => resolve(Boolean(res.confirm)),
    });
  });
}
