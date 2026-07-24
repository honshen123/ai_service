<template>
  <view class="chat-page" :class="themeClass">
    <view v-if="session" class="chat-toolbar">
      <view class="chat-toolbar__top">
        <view class="chat-toolbar__avatar">
          <text>{{ customerInitial }}</text>
        </view>
        <view class="chat-toolbar__info">
          <text class="chat-toolbar__name">{{ session.customer_nickname || '未知客户' }}</text>
          <view class="chat-toolbar__sub">
            <text class="chat-toolbar__platform">{{ platformLabel(session.platform) }}</text>
            <text v-if="session.shop_name" class="chat-toolbar__dot">·</text>
            <text v-if="session.shop_name" class="chat-toolbar__shop">{{ session.shop_name }}</text>
          </view>
        </view>
        <view class="chat-toolbar__status">
          <text class="badge-hosting" :class="'badge-hosting--' + hostingModeType(session.hosting_mode)">
            {{ hostingModeText(session.hosting_mode) }}
          </text>
          <text v-if="realtimeStatus === 'connected'" class="chat-toolbar__realtime">实时</text>
          <text v-if="session.ai_blocked === 1" class="chat-toolbar__blocked">AI 阻断</text>
        </view>
      </view>
      <view class="mode-segment">
        <text
          v-for="mode in hostingModes"
          :key="mode.value"
          class="mode-segment__item"
          :class="{ 'mode-segment__item--active': session.hosting_mode === mode.value }"
          @tap="changeHostingMode(mode.value)"
        >{{ mode.label }}</text>
      </view>
      <view class="chat-toolbar__actions">
        <button class="action-btn action-btn--primary" @tap="doTakeover">人工接管</button>
        <button class="action-btn" @tap="doRelease">释放 AI</button>
        <button class="action-btn" @tap="toggleAiPanel">{{ showAiPanel ? '收起助手' : 'AI 助手' }}</button>
      </view>
    </view>

    <view v-if="showAiPanel" class="ai-panel">
      <scroll-view v-if="suggestions.length" scroll-x class="suggest-bar" :show-scrollbar="false">
        <text v-for="(text, i) in suggestions" :key="i" class="suggest-chip" @tap="applySuggestion(text)">{{ text }}</text>
      </scroll-view>
      <view class="ai-panel__actions">
        <button v-if="canAiReply" class="action-btn action-btn--primary" :disabled="aiLoading" @tap="generateAiReply">
          {{ aiLoading ? '生成中...' : '生成回复' }}
        </button>
        <button class="action-btn action-btn--soft" :disabled="aiLoading" @tap="loadSuggestions">推荐话术</button>
        <button class="action-btn action-btn--soft" :disabled="aiLoading" @tap="loadSummary">会话摘要</button>
      </view>
    </view>

    <view v-if="aiDraft" class="ai-draft-card">
      <view class="ai-draft-card__head">
        <text class="ai-draft-card__title">
          AI 草稿{{ aiDraft.draft_status === 1 ? '（待审核）' : '（已发送）' }}
        </text>
        <text class="ai-draft-card__meta">{{ aiDraft.latency_ms }}ms</text>
      </view>
      <text class="ai-draft-card__body">{{ aiDraft.reply }}</text>
      <view v-if="aiDraft.draft_status === 1" class="ai-draft-card__actions">
        <button class="action-btn action-btn--primary" @tap="adoptAiDraft">采用并发送</button>
        <button class="action-btn" @tap="aiDraft = null">关闭</button>
      </view>
    </view>

    <scroll-view scroll-y class="chat-list" :scroll-into-view="scrollIntoView">
      <view
        v-for="item in messages"
        :id="'msg-' + item.id"
        :key="item.id"
        class="message-row"
        :class="messageRowClass(item.sender_type)"
      >
        <view
          v-if="item.sender_type !== 4 && !isCardMessage(item)"
          class="msg-avatar"
          :class="avatarClass(item.sender_type)"
        >
          <text>{{ avatarLabel(item.sender_type) }}</text>
        </view>
        <view
          class="message-bubble"
          :class="[
            messageBubbleClass(item),
            isCardMessage(item) ? 'message-bubble--card' : '',
          ]"
        >
          <view v-if="!isCardMessage(item) && item.sender_type !== 4" class="meta">
            <text>{{ senderText(item.sender_type) }}</text>
            <text>{{ formatMessageTime(item.create_time) }}</text>
          </view>
          <image
            v-if="isImageMessage(item)"
            :src="resolveMediaUrl(item.content)"
            mode="widthFix"
            class="chat-image"
            @tap="previewImage(item.content)"
          />
          <ChatProductCard
            v-else-if="isProductMessage(item)"
            :data="toProductCard(item)"
            :fallback="item.content"
          />
          <ChatOrderCard
            v-else-if="isOrderMessage(item)"
            :data="toOrderCard(item)"
            :fallback="item.content"
          />
          <text v-else class="content">{{ item.content }}</text>
        </view>
      </view>
      <view v-if="messages.length === 0" class="empty-box">
        <view class="empty-box__icon">✉️</view>
        <text class="empty-box__title">暂无消息</text>
      </view>
    </scroll-view>

    <view class="chat-input-bar">
      <view class="composer">
        <button class="composer__image" @tap="pickImage">图</button>
        <input
          v-model="sendText"
          class="composer__input"
          placeholder="输入回复内容..."
          confirm-type="send"
          @confirm="sendMessage"
        />
        <button class="composer__send" :class="{ 'composer__send--active': sendText.trim() }" @tap="sendMessage">
          发送
        </button>
      </view>
    </view>

    <view v-if="showSummary" class="popup-mask" @tap="showSummary = false">
      <view class="popup-panel" @tap.stop>
        <text class="popup-panel__title">会话摘要</text>
        <text class="popup-panel__body">{{ summaryText || '暂无摘要' }}</text>
        <button class="btn-primary popup-panel__btn" @tap="showSummary = false">知道了</button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import ChatOrderCard from '@/components/ChatOrderCard.vue';
import ChatProductCard from '@/components/ChatProductCard.vue';
import type { RealtimeEnvelope } from '@/api/realtime';
import {
  aiGenerateReply,
  aiSessionSummary,
  aiSuggestions,
  approveDraft,
  markSessionRead,
  release,
  sendManualMessage,
  sessionMessages,
  switchHostingMode,
  takeover,
  uploadChatImage,
} from '@/api/tenant';
import type { AiReplyResult, MessageItem, SessionItem } from '@/types/api';
import {
  hostingModeText,
  hostingModeType,
  isCustomerMessage,
  platformLabel,
  senderText,
} from '@/utils/session';
import {
  isImageMessage,
  isOrderMessage,
  isProductMessage,
  resolveMediaUrl,
  toOrderCard,
  toProductCard,
} from '@/utils/messageCard';
import { toastSuccess, toast, useThemeClass } from '@/composables/useApp';
import { usePermissions } from '@/composables/usePermissions';
import { useSessionRealtime } from '@/composables/useSessionRealtime';

const themeClass = useThemeClass();
const { canView } = usePermissions();
const canAiReply = computed(() => canView('ai:reply'));
const sessionId = ref(0);
const session = ref<SessionItem | null>(null);
const messages = ref<MessageItem[]>([]);
const sendText = ref('');
const suggestions = ref<string[]>([]);
const summaryText = ref('');
const aiDraft = ref<AiReplyResult | null>(null);
const aiLoading = ref(false);
const showSummary = ref(false);
const showAiPanel = ref(false);
const scrollIntoView = ref('');

const { status: realtimeStatus, connect: connectRealtime, subscribeSession: subscribeRealtimeSession } = useSessionRealtime({
  onEvent: handleRealtimeEvent,
});

const hostingModes = [
  { label: '人工', value: 0 },
  { label: '审核', value: 1 },
  { label: '托管', value: 2 },
];

const customerInitial = computed(() => {
  const name = session.value?.customer_nickname || '?';
  return name.slice(0, 1).toUpperCase();
});

function isCardMessage(item: MessageItem) {
  return isProductMessage(item) || isOrderMessage(item);
}

function messageRowClass(t: number) {
  if (t === 4) return 'message-row--center';
  return isCustomerMessage(t) ? 'message-row--left' : 'message-row--right';
}

function messageBubbleClass(item: MessageItem) {
  const t = item.sender_type;
  if (isCardMessage(item)) return 'message-bubble--card';
  if (t === 4) return 'message-bubble--system';
  if (t === 3 || t === 5) return 'message-bubble--ai';
  if (isCustomerMessage(t)) return 'message-bubble--customer';
  return 'message-bubble--agent';
}

function avatarClass(t: number) {
  if (t === 3 || t === 5) return 'msg-avatar--ai';
  if (isCustomerMessage(t)) return 'msg-avatar--customer';
  return 'msg-avatar--agent';
}

function avatarLabel(t: number) {
  if (t === 3 || t === 5) return 'AI';
  if (isCustomerMessage(t)) return customerInitial.value;
  return '客';
}

function formatMessageTime(time?: string) {
  if (!time) return '';
  return time.length >= 16 ? time.slice(11, 16) : time;
}

function previewImage(url: string) {
  const src = resolveMediaUrl(url);
  if (!src) return;
  uni.previewImage({ urls: [src] });
}

function toggleAiPanel() {
  showAiPanel.value = !showAiPanel.value;
}

async function loadMessages() {
  const result = await sessionMessages(sessionId.value, { page: 1, page_size: 50 });
  session.value = result.session;
  messages.value = result.list.reverse();
  await markSessionRead(sessionId.value);
  uni.setNavigationBarTitle({
    title: result.session?.customer_nickname || '会话详情',
  });
  if (messages.value.length) {
    scrollIntoView.value = 'msg-' + messages.value[messages.value.length - 1].id;
  }
  subscribeRealtimeSession(sessionId.value);
}

function upsertMessage(msg: MessageItem) {
  const idx = messages.value.findIndex((item) => item.id === msg.id);
  if (idx >= 0) {
    messages.value[idx] = msg;
    return;
  }
  messages.value.push(msg);
  scrollIntoView.value = 'msg-' + msg.id;
}

function handleRealtimeEvent(envelope: RealtimeEnvelope) {
  const event = envelope.event;
  const sid = Number(envelope.session_id || envelope.payload?.session_id || 0);
  if (sid !== sessionId.value) return;

  const payload = (envelope.payload || {}) as Record<string, unknown>;

  if (
    event === 'message.inbound'
    || event === 'message.outbound.sent'
    || event === 'message.ai.sent'
    || event === 'message.manual.sent'
  ) {
    const msg = payload as unknown as MessageItem;
    if (msg?.id) upsertMessage(msg);
    return;
  }

  if (event === 'ai.reply.generated') {
    aiDraft.value = payload as unknown as AiReplyResult;
    if ((payload as unknown as AiReplyResult).draft_status === 2) {
      void loadMessages();
      toastSuccess('AI 已自动发送');
    } else {
      showAiPanel.value = true;
      toastSuccess('AI 草稿已生成');
    }
    return;
  }

  if (event === 'ai.suggest.generated') {
    const list = (payload.suggestions as string[]) || [];
    suggestions.value = list;
    if (aiDraft.value) {
      aiDraft.value = { ...aiDraft.value, suggestions: list };
    } else if (list[0]) {
      sendText.value = list[0];
    }
    return;
  }

  if (
    event === 'session.updated'
    || event === 'session.takeover'
    || event === 'session.takeover.released'
    || event === 'session.hosting_mode.changed'
  ) {
    if (session.value) {
      session.value = { ...session.value, ...(payload as Partial<SessionItem>) };
    }
  }
}

async function sendMessage() {
  const content = sendText.value.trim();
  if (!content) return;
  await sendManualMessage(sessionId.value, content);
  sendText.value = '';
  suggestions.value = [];
  toastSuccess('已发送');
  await loadMessages();
}

function pickImage() {
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    success: async (res) => {
      const filePath = res.tempFilePaths?.[0];
      if (!filePath) return;
      try {
        const uploaded = await uploadChatImage(sessionId.value, filePath);
        await sendManualMessage(sessionId.value, uploaded.url, 2);
        toastSuccess('图片已发送');
        await loadMessages();
      } catch (e) {
        toast(e instanceof Error ? e.message : '图片发送失败');
      }
    },
  });
}

async function doTakeover() {
  session.value = await takeover(sessionId.value);
  toastSuccess('已接管');
}

async function doRelease() {
  session.value = await release(sessionId.value, 1);
  toastSuccess('已释放');
}

async function changeHostingMode(mode: number) {
  if (session.value?.hosting_mode === mode) return;
  session.value = await switchHostingMode(sessionId.value, mode);
  toastSuccess(hostingModeText(mode));
}

function lastCustomerQuestion(): string {
  const customer = [...messages.value].reverse().find(
    (m) => isCustomerMessage(m.sender_type) && m.message_type !== 2 && !isCardMessage(m),
  );
  if (customer?.content?.trim()) {
    return customer.content.trim();
  }
  const cardMsg = [...messages.value].reverse().find(
    (m) => isCustomerMessage(m.sender_type) && isCardMessage(m),
  );
  return cardMsg?.content?.trim() || '';
}

async function generateAiReply() {
  const question = lastCustomerQuestion();
  if (!question) {
    toast('暂无客户问题，无法生成回复');
    return;
  }
  showAiPanel.value = true;
  aiLoading.value = true;
  try {
    aiDraft.value = await aiGenerateReply(sessionId.value, { question });
    if (aiDraft.value.suggestions?.length) {
      suggestions.value = aiDraft.value.suggestions;
    }
    if (aiDraft.value.draft_status === 2) {
      toastSuccess('AI 已自动发送');
      aiDraft.value = null;
      await loadMessages();
    } else {
      toastSuccess('AI 草稿已生成');
    }
  } finally {
    aiLoading.value = false;
  }
}

async function adoptAiDraft() {
  if (!aiDraft.value?.reply) return;
  await approveDraft(sessionId.value, aiDraft.value.message_id || 0);
  aiDraft.value = null;
  suggestions.value = [];
  toastSuccess('已发送 AI 草稿');
  await loadMessages();
}

async function loadSuggestions() {
  showAiPanel.value = true;
  aiLoading.value = true;
  try {
    suggestions.value = await aiSuggestions(sessionId.value, {
      question: lastCustomerQuestion(),
      reply: aiDraft.value?.reply || '',
    });
  } finally {
    aiLoading.value = false;
  }
}

function applySuggestion(text: string) {
  sendText.value = text;
}

async function loadSummary() {
  aiLoading.value = true;
  try {
    summaryText.value = await aiSessionSummary(sessionId.value);
    showSummary.value = true;
  } finally {
    aiLoading.value = false;
  }
}

onLoad((options) => {
  sessionId.value = Number(options?.sessionId || 0);
  void connectRealtime();
  if (sessionId.value) {
    loadMessages();
  }
});
</script>

<style scoped lang="scss">
.chat-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--cs-bg-page);
}

.chat-toolbar {
  padding: 12px 16px;
  background: var(--cs-bg-elevated);
  border-bottom: 1px solid var(--cs-divider);
}

.chat-toolbar__top {
  display: flex;
  align-items: center;
  gap: 12px;
}

.chat-toolbar__avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--cs-primary-soft);
  color: var(--cs-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 600;
  flex-shrink: 0;
}

.chat-toolbar__info {
  flex: 1;
  min-width: 0;
}

.chat-toolbar__name {
  display: block;
  font-size: 16px;
  font-weight: 600;
  color: var(--cs-text-primary);
}

.chat-toolbar__sub {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 2px;
}

.chat-toolbar__platform,
.chat-toolbar__shop {
  font-size: 12px;
  color: var(--cs-text-muted);
}

.chat-toolbar__shop {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 120px;
}

.chat-toolbar__dot {
  color: var(--cs-text-muted);
  font-size: 12px;
}

.chat-toolbar__status {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
  flex-shrink: 0;
}

.chat-toolbar__blocked {
  font-size: 10px;
  font-weight: 700;
  color: var(--cs-danger);
}

.chat-toolbar__realtime {
  font-size: 10px;
  font-weight: 600;
  color: var(--cs-success, #00b42a);
}

.mode-segment {
  display: flex;
  margin-top: 10px;
  padding: 3px;
  background: var(--cs-bg-subtle);
  border-radius: var(--cs-radius-md);
  border: 1px solid var(--cs-divider);
}

.mode-segment__item {
  flex: 1;
  text-align: center;
  padding: 7px 0;
  font-size: 12px;
  font-weight: 500;
  color: var(--cs-text-muted);
  border-radius: 6px;
}

.mode-segment__item--active {
  background: var(--cs-bg-elevated);
  color: var(--cs-primary);
  font-weight: 600;
}

.chat-toolbar__actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

.action-btn {
  flex: 1;
  padding: 8px 0;
  font-size: 13px;
  font-weight: 500;
  border-radius: var(--cs-radius-md);
  border: 1px solid var(--cs-divider);
  background: var(--cs-bg-elevated);
  color: var(--cs-text-secondary);
}

.action-btn--primary {
  background: var(--cs-primary);
  border-color: transparent;
  color: #fff;
}

.action-btn--soft {
  background: var(--cs-primary-soft);
  border-color: transparent;
  color: var(--cs-primary);
}

.ai-panel {
  padding: 10px 16px 12px;
  background: var(--cs-bg-elevated);
  border-bottom: 1px solid var(--cs-divider);
}

.ai-panel__actions {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.suggest-bar {
  white-space: nowrap;
}

.suggest-chip {
  display: inline-block;
  max-width: 260px;
  padding: 10px 14px;
  background: var(--cs-accent-soft);
  color: var(--cs-accent);
  border-radius: var(--cs-radius-md);
  font-size: 13px;
  margin-right: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ai-draft-card {
  margin: 0 12px 8px;
  padding: 12px;
  background: var(--cs-primary-soft);
  border: 1px solid var(--cs-primary);
  border-radius: var(--cs-radius-lg);
}

.ai-draft-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 8px;
}

.ai-draft-card__title {
  font-size: 13px;
  font-weight: 600;
  color: var(--cs-primary);
}

.ai-draft-card__meta {
  font-size: 11px;
  color: var(--cs-text-muted);
}

.ai-draft-card__body {
  display: block;
  font-size: 14px;
  line-height: 1.6;
  color: var(--cs-text-primary);
  white-space: pre-wrap;
}

.ai-draft-card__actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

.chat-list {
  flex: 1;
  height: calc(100vh - 280px);
}

.composer {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 4px 4px 12px;
  background: var(--cs-bg-input);
  border: 1px solid var(--cs-divider);
  border-radius: var(--cs-radius-md);
}

.composer__image {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  line-height: 36px;
  padding: 0;
  margin: 0;
  font-size: 13px;
  color: var(--cs-text-secondary);
  background: transparent;
  border: none;
}

.composer__input {
  flex: 1;
  min-height: 36px;
  font-size: 15px;
  background: transparent;
  border: none;
}

.composer__send {
  padding: 7px 14px;
  font-size: 14px;
  font-weight: 500;
  border-radius: 6px;
  background: var(--cs-bg-subtle);
  color: var(--cs-text-muted);
  border: none;
}

.composer__send--active {
  background: var(--cs-primary);
  color: #fff;
}

.popup-panel__body {
  display: block;
  font-size: 15px;
  line-height: 1.65;
  color: var(--cs-text-secondary);
}

.popup-panel__btn {
  width: 100%;
  margin-top: 18px;
  padding: 12px;
}
</style>
