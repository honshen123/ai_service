import http from './request';
import { clearAuthStorage, getAccessToken, getCsrfToken, getTenantCode } from '@/store/auth';
import type {
  ApiResponse,
  BillingOrder,
  BillingPackage,
  BillingPaymentChannel,
  BillingRecordItem,
  BillingWallet,
  KnowledgeBaseItem,
  KnowledgeDocumentItem,
  LoginResult,
  MessageItem,
  PageResult,
  PlatformItem,
  PlatformShopItem,
  SessionItem,
  StatisticsAgentItem,
  StatisticsChannelItem,
  StatisticsOverview,
  StatisticsQuality,
  StatisticsTrendItem,
  TenantInfo,
  TicketCommentItem,
  TicketDetailResult,
  TicketItem,
  UserInfo,
  NotificationInbox,
  AgentItem,
  AgentListResult,
  AiLearningSettings,
  QualityCheckItem,
  PromptSceneItem,
  TenantAiModelItem,
  TenantAiModelsPayload,
  TenantAiProviderOption,
  TenantAiPromptItem,
  TenantSensitiveWordItem,
  AiReplyResult,
} from '@/types/api';

const BASE_URL = import.meta.env.VITE_API_PREFIX || '';

export async function login(payload: { username: string; password: string }) {
  const { data } = await http.post<LoginResult>('/tenant/auth/login', payload);
  return data.data;
}

export async function me() {
  const { data } = await http.get<UserInfo>('/tenant/auth/me');
  return data.data;
}

export async function updateProfile(payload: {
  nickname?: string;
  email?: string;
  phone?: string;
  old_password?: string;
  password?: string;
}) {
  const { data } = await http.put<UserInfo>('/tenant/auth/profile', payload);
  return data.data;
}

export async function logout(refreshToken: string) {
  const { data } = await http.post<null>('/tenant/auth/logout', { refresh_token: refreshToken });
  return data.data;
}

export async function tenantInfo() {
  const { data } = await http.get<TenantInfo>('/tenant/info');
  return data.data;
}

export async function messageDashboard(params: { page: number; page_size: number; keyword?: string }) {
  const { data } = await http.get<PageResult<SessionItem>>('/tenant/message/dashboard', { params });
  return data.data;
}

export async function sessionMessages(sessionId: number, params: { page: number; page_size: number }) {
  const { data } = await http.get<PageResult<MessageItem> & { session: SessionItem }>(
    `/tenant/message/sessions/${sessionId}/messages`,
    { params },
  );
  return data.data;
}

export async function sendManualMessage(sessionId: number, content: string, messageType = 1) {
  const { data } = await http.post<MessageItem>(`/tenant/message/sessions/${sessionId}/send`, {
    content,
    message_type: messageType,
  });
  return data.data;
}

export async function uploadChatImage(sessionId: number, filePath: string) {
  const token = getAccessToken();
  const tenantCode = getTenantCode();
  return new Promise<{ url: string; filename: string }>((resolve, reject) => {
    uni.uploadFile({
      url: `${BASE_URL}/tenant/message/sessions/${sessionId}/upload-image`,
      filePath,
      name: 'file',
      header: {
        Authorization: token ? `Bearer ${token}` : '',
        ...(tenantCode ? { 'X-Tenant-Code': tenantCode } : {}),
        ...(getCsrfToken() ? { 'X-CSRF-Token': getCsrfToken()! } : {}),
      },
      success: (res) => {
        try {
          const payload = JSON.parse(res.data) as ApiResponse<{ url: string; filename: string }>;
          if (payload.code !== 0 || !payload.data?.url) {
            reject(new Error(payload.message || '上传失败'));
            return;
          }
          resolve(payload.data);
        } catch {
          reject(new Error('上传响应解析失败'));
        }
      },
      fail: (err) => reject(err),
    });
  });
}

export async function takeover(sessionId: number) {
  const { data } = await http.post<SessionItem>(`/tenant/message/sessions/${sessionId}/takeover`);
  return data.data;
}

export async function release(sessionId: number, hostingMode = 1) {
  const { data } = await http.post<SessionItem>(`/tenant/message/sessions/${sessionId}/release`, {
    hosting_mode: hostingMode,
  });
  return data.data;
}

export async function switchHostingMode(sessionId: number, hostingMode: number) {
  const { data } = await http.post<SessionItem>(`/tenant/message/sessions/${sessionId}/hosting-mode`, {
    hosting_mode: hostingMode,
  });
  return data.data;
}

export async function markSessionRead(sessionId: number) {
  const { data } = await http.post<null>(`/tenant/message/sessions/${sessionId}/read`);
  return data.data;
}

export async function aiSuggestions(sessionId: number, payload?: { question?: string; reply?: string }) {
  const { data } = await http.post<string[]>(`/tenant/ai/sessions/${sessionId}/suggestions`, payload || {});
  return data.data;
}

export async function aiSessionSummary(sessionId: number) {
  const { data } = await http.post<{ summary: string }>(`/tenant/ai/sessions/${sessionId}/summary`);
  return data.data.summary;
}

export async function aiGenerateReply(
  sessionId: number,
  payload: { question: string; order_no?: string; scene?: string; force?: boolean },
) {
  const { data } = await http.post<AiReplyResult>(`/tenant/ai/sessions/${sessionId}/reply`, payload);
  return data.data;
}

export async function approveDraft(sessionId: number, messageId = 0) {
  const { data } = await http.post<MessageItem>(`/tenant/message/sessions/${sessionId}/approve-draft`, {
    message_id: messageId,
  });
  return data.data;
}

export async function knowledgeBases() {
  const { data } = await http.get<KnowledgeBaseItem[]>('/tenant/knowledge/bases');
  return data.data;
}

export async function createKnowledgeBase(payload: { name: string; description?: string; shop_id?: number }) {
  const { data } = await http.post<KnowledgeBaseItem>('/tenant/knowledge/bases', payload);
  return data.data;
}

export async function knowledgeDocuments(baseId: number) {
  const { data } = await http.get<KnowledgeDocumentItem[]>(`/tenant/knowledge/bases/${baseId}/documents`);
  return data.data;
}

export async function ingestDocument(
  baseId: number,
  payload: { content: string; title?: string; product_id?: string; sku_id?: string },
) {
  const { data } = await http.post<{ document_id: number; chunk_count: number }>(
    `/tenant/knowledge/bases/${baseId}/documents`,
    payload,
  );
  return data.data;
}

export function uploadKnowledgeDocument(
  baseId: number,
  filePath: string,
  payload: { title?: string; product_id?: string; sku_id?: string } = {},
): Promise<{ document_id: number; chunk_count: number; file_type?: string }> {
  return new Promise((resolve, reject) => {
    const token = getAccessToken();
    const tenantCode = getTenantCode();
    const header: Record<string, string> = {};
    if (token) header.Authorization = `Bearer ${token}`;
    if (tenantCode) header['X-Tenant-Code'] = tenantCode;

    const formData: Record<string, string> = {};
    if (payload.title) formData.title = payload.title;
    if (payload.product_id) formData.product_id = payload.product_id;
    if (payload.sku_id) formData.sku_id = payload.sku_id;

    uni.uploadFile({
      url: `${import.meta.env.VITE_API_PREFIX || ''}/tenant/knowledge/bases/${baseId}/documents`,
      filePath,
      name: 'file',
      formData,
      header,
      timeout: 120000,
      success: (res) => {
        if (res.statusCode === 401) {
          clearAuthStorage();
          uni.showToast({ title: '登录已失效', icon: 'none' });
          uni.reLaunch({ url: '/pages/login/index' });
          reject(new Error('Unauthorized'));
          return;
        }
        try {
          const payload = JSON.parse(res.data) as ApiResponse<{ document_id: number; chunk_count: number; file_type?: string }>;
          if (payload.code !== 0) {
            uni.showToast({ title: payload.message || '上传失败', icon: 'none' });
            reject(new Error(payload.message || 'Upload failed'));
            return;
          }
          resolve(payload.data);
        } catch {
          reject(new Error('响应解析失败'));
        }
      },
      fail: (err) => {
        uni.showToast({ title: err.errMsg || '上传失败', icon: 'none' });
        reject(err);
      },
    });
  });
}

export async function deleteDocument(id: number) {
  const { data } = await http.delete<{ deleted: boolean }>(`/tenant/knowledge/documents/${id}`);
  return data.data;
}

export async function tickets(params: { page: number; page_size: number; keyword?: string; status?: number }) {
  const { data } = await http.get<PageResult<TicketItem>>('/tenant/tickets', { params });
  return data.data;
}

export async function ticketDetail(id: number) {
  const { data } = await http.get<TicketDetailResult>(`/tenant/tickets/${id}`);
  return data.data;
}

export async function createTicket(payload: { title: string; content?: string; priority?: number }) {
  const { data } = await http.post<{ ticket: TicketItem }>('/tenant/tickets', payload);
  return data.data;
}

export async function updateTicketStatus(id: number, status: number, remark = '') {
  const { data } = await http.post<{ ticket: TicketItem }>(`/tenant/tickets/${id}/status`, {
    status,
    remark,
  });
  return data.data;
}

export async function addTicketComment(id: number, content: string, isInternal = 0) {
  const { data } = await http.post<TicketCommentItem>(`/tenant/tickets/${id}/comments`, {
    content,
    is_internal: isInternal,
  });
  return data.data;
}

export async function statisticsOverview(days = 7) {
  const { data } = await http.get<StatisticsOverview>('/tenant/statistics/overview', { params: { days } });
  return data.data;
}

export async function statisticsTrend(days = 7) {
  const { data } = await http.get<StatisticsTrendItem[]>('/tenant/statistics/trend', { params: { days } });
  return data.data;
}

export async function statisticsChannels(days = 7) {
  const { data } = await http.get<StatisticsChannelItem[]>('/tenant/statistics/channels', { params: { days } });
  return data.data;
}

export async function statisticsAgents(days = 7) {
  const { data } = await http.get<StatisticsAgentItem[]>('/tenant/statistics/agents', { params: { days } });
  return data.data;
}

export async function statisticsQuality(days = 7) {
  const { data } = await http.get<StatisticsQuality>('/tenant/statistics/quality', { params: { days } });
  return data.data;
}

export async function billingWallet() {
  const { data } = await http.get<BillingWallet>('/tenant/billing/wallet');
  return data.data;
}

export async function billingPackages() {
  const { data } = await http.get<BillingPackage[]>('/tenant/billing/packages');
  return data.data;
}

export async function billingOrders(params: { page: number; page_size: number }) {
  const { data } = await http.get<PageResult<BillingOrder>>('/tenant/billing/orders', { params });
  return data.data;
}

export async function billingPaymentChannels() {
  const { data } = await http.get<BillingPaymentChannel[]>('/tenant/billing/payment-channels');
  return data.data;
}

export async function createBillingOrder(payload: { order_type: number; package_id?: number; period?: 'monthly' | 'yearly' }) {
  const { data } = await http.post<BillingOrder>('/tenant/billing/orders', payload);
  return data.data;
}

export async function payBillingOrder(id: number, channel: string) {
  const { data } = await http.post<{ payment_no: string; pay_url: string }>(`/tenant/billing/orders/${id}/pay`, {
    channel,
  });
  return data.data;
}

export async function confirmPayment(paymentNo: string) {
  const { data } = await http.post<{ status: string }>(`/tenant/billing/payments/${paymentNo}/confirm`, {});
  return data.data;
}

export async function supportedPlatforms() {
  const { data } = await http.get<PlatformItem[]>('/tenant/platforms');
  return data.data;
}

export async function platformShops() {
  const { data } = await http.get<PlatformShopItem[]>('/tenant/platform/shops');
  return data.data;
}

export async function bindPlatformShop(payload: {
  platform: string;
  shop_id: string;
  shop_name: string;
  seller_id?: string;
  hosting_mode?: number;
}) {
  const { data } = await http.post<PlatformShopItem>('/tenant/platform/shops', payload);
  return data.data;
}

export async function fetchNotifications(limit = 20) {
  const { data } = await http.get<NotificationInbox>('/tenant/notifications', { params: { limit } });
  return data.data;
}

export async function markNotificationsRead(keys: string[]) {
  const { data } = await http.post<null>('/tenant/notifications/read', { keys });
  return data.data;
}

export async function markAllNotificationsRead() {
  const { data } = await http.post<null>('/tenant/notifications/read-all', {});
  return data.data;
}

export async function agents(params?: { page?: number; page_size?: number; keyword?: string; status?: number }) {
  const { data } = await http.get<AgentListResult>('/tenant/agents', { params });
  return data.data;
}

export async function createAgent(payload: {
  username: string;
  password: string;
  nickname?: string;
  email?: string;
  phone?: string;
  shop_ids?: number[];
}) {
  const { data } = await http.post<AgentItem>('/tenant/agents', payload);
  return data.data;
}

export async function updateAgent(
  id: number,
  payload: {
    nickname?: string;
    email?: string;
    phone?: string;
    password?: string;
    shop_ids?: number[];
  },
) {
  const { data } = await http.put<AgentItem>(`/tenant/agents/${id}`, payload);
  return data.data;
}

export async function updateAgentStatus(id: number, status: number) {
  const { data } = await http.put<AgentItem>(`/tenant/agents/${id}/status`, { status });
  return data.data;
}

export async function aiLearningSettings() {
  const { data } = await http.get<AiLearningSettings>('/tenant/system-settings/ai-learning');
  return data.data;
}

export async function saveAiLearningSettings(payload: Partial<AiLearningSettings>) {
  const { data } = await http.put<AiLearningSettings>('/tenant/system-settings/ai-learning', payload);
  return data.data;
}

export async function qualityPending(params: { page?: number; page_size?: number }) {
  const { data } = await http.get<PageResult<QualityCheckItem>>('/tenant/quality/pending', { params });
  return data.data;
}

export async function approveQualityCheck(id: number) {
  const { data } = await http.post<Record<string, unknown>>(`/tenant/quality/checks/${id}/approve`);
  return data.data;
}

export async function rejectQualityCheck(id: number, reason?: string) {
  const { data } = await http.post<QualityCheckItem>(`/tenant/quality/checks/${id}/reject`, { reason });
  return data.data;
}

export async function billingRecords(params: Record<string, string | number>) {
  const { data } = await http.get<PageResult<BillingRecordItem>>('/tenant/billing/records', { params });
  return data.data;
}

export async function fetchAiModels() {
  const { data } = await http.get<TenantAiModelsPayload>('/tenant/ai/models');
  return data.data;
}

export async function fetchAiProviders() {
  const { data } = await http.get<TenantAiProviderOption[]>('/tenant/ai/providers');
  return (data.data ?? []).map((item) => ({ ...item, models: item.models ?? [] }));
}

export async function saveAiModel(payload: {
  id?: number;
  provider: string;
  model_name: string;
  display_name?: string;
  model_type?: number;
  api_base_url?: string;
  api_key?: string;
  max_tokens?: number;
  temperature?: number;
  billing_level_min?: number;
  complexity_min?: number;
  priority?: number;
  status?: number;
}) {
  const { data } = await http.post<TenantAiModelItem>('/tenant/ai/models', payload);
  return data.data;
}

export async function aiPromptScenes() {
  const { data } = await http.get<PromptSceneItem[]>('/tenant/ai/prompt-scenes');
  return data.data;
}

export async function fetchAiPrompts(scene?: string) {
  const { data } = await http.get<TenantAiPromptItem[]>('/tenant/ai/prompts', {
    params: scene ? { scene } : undefined,
  });
  return data.data;
}

export async function saveAiPrompt(payload: {
  scene: string;
  name: string;
  system_prompt: string;
  description?: string;
  is_active?: number;
  variables_json?: Record<string, unknown>;
}) {
  const { data } = await http.post<TenantAiPromptItem>('/tenant/ai/prompts', payload);
  return data.data;
}

export async function activateAiPrompt(id: number) {
  const { data } = await http.post<null>(`/tenant/ai/prompts/${id}/activate`);
  return data.data;
}

export async function fetchSensitiveWords() {
  const { data } = await http.get<TenantSensitiveWordItem[]>('/tenant/ai/sensitive-words');
  return data.data;
}

export async function saveSensitiveWord(payload: {
  id?: number;
  word: string;
  category?: string;
  level?: number;
  match_mode?: number;
  replacement?: string;
  status?: number;
}) {
  const { data } = await http.post<TenantSensitiveWordItem>('/tenant/ai/sensitive-words', payload);
  return data.data;
}

export async function deleteSensitiveWord(id: number) {
  const { data } = await http.delete<null>(`/tenant/ai/sensitive-words/${id}`);
  return data.data;
}
