export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

export interface UserInfo {
  id: number;
  tenant_id: number;
  username: string;
  nickname: string;
  email?: string;
  phone?: string;
  is_tenant_admin?: boolean;
  permissions: string[];
}

export interface LoginResult {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user: UserInfo;
}

export interface PageResult<T> {
  total: number;
  page: number;
  page_size: number;
  list: T[];
}

export interface TenantInfo {
  id: number;
  code: string;
  name: string;
  status: number;
  package_id: number;
  token_balance: number;
  message_balance: number;
  seat_limit: number;
  seat_used: number;
  shop_limit: number;
  shop_used: number;
}

export interface SessionItem {
  id: number;
  platform: string;
  shop_id?: number;
  shop_name?: string;
  customer_nickname: string;
  customer_avatar?: string;
  platform_user_id: string;
  assigned_agent_nickname?: string;
  hosting_mode: number;
  session_status: number;
  ai_blocked: number;
  priority: number;
  emotion_score: number;
  last_message_time?: string;
  session_summary?: string;
  product_id?: string;
  sku_id?: string;
}

export interface MessageItem {
  id: number;
  session_id: number;
  sender_type: number;
  message_type?: number;
  content: string;
  extra_json?: Record<string, unknown> | string;
  ai_draft_status?: number;
  create_time?: string;
}

export interface AiReplyResult {
  session_id: number;
  message_id?: number;
  reply: string;
  hosting_mode: number;
  draft_status: number;
  auto_transfer_to_human: boolean;
  suggestions: string[];
  session_summary?: string;
  token_used: number;
  latency_ms: number;
}

export interface KnowledgeBaseItem {
  id: number;
  shop_id: number;
  name: string;
  description: string;
  doc_count: number;
  chunk_count: number;
  status: number;
}

export interface KnowledgeDocumentItem {
  id: number;
  knowledge_base_id: number;
  title: string;
  source_type: number;
  product_id: string;
  sku_id: string;
  status: number;
  chunk_count: number;
  metadata_json?: Record<string, unknown> | null;
  create_time?: string;
}

export interface TicketItem {
  id: number;
  ticket_no: string;
  title: string;
  content: string;
  category: string;
  priority: number;
  status: number;
  assigned_user_id?: number;
  create_time?: string;
}

export interface TicketCommentItem {
  id: number;
  ticket_id: number;
  user_id: number;
  content: string;
  is_internal: number;
  create_time?: string;
}

export interface TicketFlowItem {
  id: number;
  ticket_id: number;
  action: string;
  from_status: number;
  to_status: number;
  remark: string;
  create_time?: string;
}

export interface TicketDetailResult {
  ticket: TicketItem;
  flows: TicketFlowItem[];
  comments: TicketCommentItem[];
}

export interface StatisticsOverview {
  days: number;
  session_count: number;
  message_count: number;
  ai_message_count: number;
  human_message_count: number;
  transfer_human_count: number;
  ticket_created_count: number;
  ticket_resolved_count: number;
  token_consumed: number;
  avg_ai_score: number;
  avg_response_time: number;
  emotion_alert_count: number;
  resolution_rate: number;
}

export interface StatisticsTrendItem {
  date: string;
  session_count: number;
  message_count: number;
  ai_message_count: number;
  human_message_count: number;
  ticket_created_count: number;
  ticket_resolved_count: number;
  avg_ai_score: number;
  token_consumed: number;
}

export interface StatisticsChannelItem {
  platform: string;
  session_count: number;
}

export interface StatisticsAgentItem {
  user_id: number;
  reply_count: number;
}

export interface StatisticsQuality {
  days: number;
  checked_count: number;
  avg_score: number;
  high_score_count: number;
  extracted_count: number;
  extract_rate: number;
}

export interface BillingWallet {
  token_balance: number;
  message_balance: number;
  seat_limit: number;
  seat_used: number;
  shop_limit: number;
  shop_used: number;
  version: number;
}

export interface BillingOrder {
  id: number;
  order_no: string;
  order_type: number;
  amount: number;
  pay_amount: number;
  pay_status: number;
  create_time?: string;
}

export interface BillingPackage {
  id: number;
  name: string;
  code: string;
  price_monthly: number;
  price_yearly: number;
  token_quota: number;
  message_quota: number;
  seat_quota?: number;
  shop_quota?: number;
}

export interface BillingPaymentChannel {
  code: string;
  name: string;
  enabled: boolean;
}

export interface PlatformItem {
  code: string;
  name: string;
}

export interface PlatformShopItem {
  id: number;
  platform: string;
  shop_name: string;
  shop_id: string;
  seller_id: string;
  hosting_mode: number;
  status: number;
  create_time?: string;
}

export interface NotificationItem {
  key: string;
  type: string;
  title: string;
  content: string;
  link: string;
  create_time: string | null;
  is_read: boolean;
  meta?: Record<string, unknown>;
}

export interface NotificationInbox {
  unread_count: number;
  list: NotificationItem[];
}

export interface AgentShopBrief {
  id: number;
  platform: string;
  shop_name: string;
  shop_id: string;
  status: number;
}

export interface AgentItem {
  id: number;
  username: string;
  nickname: string;
  email: string;
  phone: string;
  department_id: number;
  status: number;
  is_online: number;
  shop_ids: number[];
  shops: AgentShopBrief[];
  create_time?: string | null;
  last_login_time?: string | null;
}

export interface AgentSeatQuota {
  seat_limit: number;
  seat_used: number;
  seat_available: number | null;
}

export interface AgentListResult {
  total: number;
  page: number;
  page_size: number;
  seat_quota: AgentSeatQuota;
  list: AgentItem[];
}

export interface AiLearningSettings {
  qa_auto_review: boolean;
  qa_extract_threshold: number;
}

export interface PromptSceneItem {
  code: string;
  name: string;
}

export interface TenantAiModelCatalogItem {
  model_name: string;
  display_name: string;
  model_type: number;
}

export interface TenantAiProviderOption {
  code: string;
  enabled: boolean;
  protocol: string;
  default_api_base_url: string;
  has_default_api_key: boolean;
  models?: TenantAiModelCatalogItem[];
}

export interface TenantAiModelItem {
  id: number;
  tenant_id?: number;
  scope?: 'tenant' | 'platform';
  editable?: boolean;
  provider: string;
  model_name: string;
  display_name: string;
  model_type: number;
  api_base_url: string;
  provider_protocol: string;
  provider_enabled: boolean;
  max_tokens: number;
  temperature: number;
  billing_level_min: number;
  complexity_min: number;
  priority: number;
  cost_per_1k_input: number;
  cost_per_1k_output: number;
  status: number;
}

export interface TenantAiModelsPayload {
  tenant_models: TenantAiModelItem[];
  platform_templates: TenantAiModelItem[];
  availability: {
    chat: boolean;
    vision: boolean;
    embedding: boolean;
  };
}

export interface TenantAiPromptItem {
  id: number;
  name: string;
  scene: string;
  version: number;
  is_active: number;
  system_prompt: string;
  variables_json: Record<string, unknown>;
  description: string;
  created_by: number;
  create_time: string | null;
}

export interface TenantSensitiveWordItem {
  id: number;
  word: string;
  category: string;
  level: number;
  match_mode: number;
  replacement: string;
  status: number;
  create_time?: string;
  update_time?: string;
}

export interface QualityCheckItem {
  id: number;
  session_id: number;
  message_id: number;
  ai_score: number;
  qa_question: string;
  qa_answer: string;
  extract_threshold: number;
  feedback: string;
  status: number;
  status_label: string;
  create_time?: string;
}

export interface BillingRecordItem {
  id: number;
  billing_no: string;
  billing_type: number;
  amount: number;
  quantity: number;
  change_amount: number;
  direction: 'consume' | 'credit';
  balance_before: number;
  balance_after: number;
  balance_field: string;
  ref_type: string;
  ref_id: number;
  remark: string;
  create_time?: string;
}
