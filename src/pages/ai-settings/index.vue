<template>
  <view class="page page-with-nav ai-settings-page" :class="themeClass">
    <scroll-view v-if="visibleTabs.length > 1" scroll-x class="tab-bar" :show-scrollbar="false">
      <view class="tab-bar__inner">
        <view
          v-for="tab in visibleTabs"
          :key="tab.key"
          class="tab-item"
          :class="{ 'tab-item--active': activeTab === tab.key }"
          @tap="switchTab(tab.key)"
        >
          <text>{{ tab.label }}</text>
        </view>
      </view>
    </scroll-view>

    <scroll-view scroll-y class="scroll-body" @scrolltolower="onScrollLower">
      <!-- 模型 -->
      <view v-if="activeTab === 'models' && canManageModels">
        <view v-if="modelAvailability" class="availability-banner">
          <text>{{ modelAvailabilitySummary }}</text>
        </view>
        <view class="toolbar">
          <button class="btn-primary mini-btn" @tap="openModelDialog()">新增模型</button>
        </view>
        <view class="section-title">租户自有模型</view>
        <view v-for="row in tenantModels" :key="'tenant-' + row.id" class="card-block item-card">
          <view class="item-card__head">
            <text class="item-card__title">{{ row.display_name || row.model_name }}</text>
            <text class="item-card__tag" :class="row.status === 1 ? 'is-on' : 'is-off'">
              {{ row.status === 1 ? '启用' : '禁用' }}
            </text>
          </view>
          <text class="item-card__meta">{{ row.provider }} · {{ modelTypeLabel(row.model_type) }}</text>
          <text class="item-card__meta">模型 ID：{{ row.model_name }}</text>
          <text class="item-card__meta">优先级 {{ row.priority }}</text>
          <view class="item-card__actions">
            <button class="btn-plain mini-btn" @tap="openModelDialog(row)">编辑</button>
          </view>
        </view>
        <view v-if="tenantModels.length === 0 && !loading" class="empty-box">暂无租户模型，运行时将回退到平台模板</view>

        <view class="section-title section-title--platform">平台模板（只读 fallback）</view>
        <view v-for="row in platformTemplates" :key="'platform-' + row.id" class="card-block item-card item-card--readonly">
          <view class="item-card__head">
            <text class="item-card__title">{{ row.display_name || row.model_name }}</text>
            <text class="item-card__tag item-card__tag--platform">平台</text>
          </view>
          <text class="item-card__meta">{{ row.provider }} · {{ modelTypeLabel(row.model_type) }}</text>
          <text class="item-card__meta">模型 ID：{{ row.model_name }}</text>
          <text class="item-card__meta">状态 {{ row.status === 1 ? '启用' : '禁用' }} · 优先级 {{ row.priority }}</text>
        </view>
        <view v-if="platformTemplates.length === 0 && !loading" class="empty-box">暂无平台模板</view>
      </view>

      <!-- Prompt -->
      <view v-if="activeTab === 'prompts' && canManagePrompts">
        <view class="toolbar">
          <picker :range="sceneFilterLabels" :value="sceneFilterIndex" @change="onSceneFilterChange">
            <view class="filter-picker">{{ sceneFilterLabels[sceneFilterIndex] || '全部场景' }}</view>
          </picker>
          <button class="btn-primary mini-btn" @tap="openPromptDialog">新建版本</button>
        </view>
        <view v-for="row in prompts" :key="row.id" class="card-block item-card">
          <view class="item-card__head">
            <text class="item-card__title">{{ row.name }}</text>
            <text class="item-card__tag" :class="row.is_active === 1 ? 'is-on' : 'is-off'">
              {{ row.is_active === 1 ? '生效' : 'v' + row.version }}
            </text>
          </view>
          <text class="item-card__meta">场景：{{ sceneName(row.scene) }}</text>
          <text class="item-card__meta">版本 v{{ row.version }} · {{ row.create_time || '-' }}</text>
          <view class="item-card__actions">
            <button class="btn-plain mini-btn" @tap="openPromptPreview(row)">查看</button>
            <button v-if="row.is_active !== 1" class="btn-primary mini-btn" @tap="activatePrompt(row)">设为生效</button>
          </view>
        </view>
        <view v-if="prompts.length === 0 && !loading" class="empty-box">暂无 Prompt 版本</view>
      </view>

      <!-- 敏感词 -->
      <view v-if="activeTab === 'sensitive' && canManageSensitive">
        <view class="toolbar">
          <button class="btn-primary mini-btn" @tap="openSensitiveDialog()">新增敏感词</button>
        </view>
        <view v-for="row in sensitiveWords" :key="row.id" class="card-block item-card">
          <view class="item-card__head">
            <text class="item-card__title">{{ row.word }}</text>
            <text class="item-card__tag" :class="row.status === 1 ? 'is-on' : 'is-off'">
              {{ row.status === 1 ? '启用' : '禁用' }}
            </text>
          </view>
          <text class="item-card__meta">{{ levelLabel(row.level) }} · {{ matchModeLabel(row.match_mode) }} · {{ row.category }}</text>
          <text class="item-card__meta">替换：{{ row.replacement }}</text>
          <view class="item-card__actions">
            <button class="btn-plain mini-btn" @tap="openSensitiveDialog(row)">编辑</button>
            <button class="btn-danger-plain mini-btn" @tap="removeSensitive(row)">删除</button>
          </view>
        </view>
        <view v-if="sensitiveWords.length === 0 && !loading" class="empty-box">暂无敏感词</view>
      </view>

      <!-- 审核设置 -->
      <view v-if="activeTab === 'review' && canManageReview">
        <view class="card-block">
          <text class="section-title">AI 自学习 · QA 审核</text>
          <text class="settings-desc">
            高分对话（达到阈值）可自动抽取问答对写入知识库。开启自动审核将跳过人工确认；关闭后需在知识库 QA 审核中通过后才会入库。
          </text>

          <view class="settings-row">
            <text class="settings-row__label">自动审核入库</text>
            <switch :checked="reviewForm.qa_auto_review" @change="onAutoReviewChange" />
          </view>
          <text class="settings-hint">
            {{ reviewForm.qa_auto_review ? '当前：高分 QA 将自动写入知识库。' : '当前：高分 QA 进入待审核队列，需人工通过后才会入库。' }}
          </text>

          <view class="form-field">
            <text class="form-field__label">提取分数阈值（50–100）</text>
            <slider
              :value="reviewForm.qa_extract_threshold"
              :min="50"
              :max="100"
              :step="0.5"
              show-value
              activeColor="var(--cs-primary)"
              @change="onThresholdChange"
            />
            <text class="settings-hint">AI 回复质检分数 ≥ 该阈值时，才会触发 QA 提取。</text>
          </view>

          <button class="btn-primary save-btn" :disabled="reviewSaving" @tap="saveReviewSettings">保存设置</button>
        </view>
      </view>
    </scroll-view>

    <!-- 模型弹窗 -->
    <view v-if="modelDialogVisible" class="popup-mask" @tap="modelDialogVisible = false">
      <view class="popup-panel popup-panel--tall" @tap.stop>
        <text class="popup-panel__title">{{ modelForm.id ? '编辑模型' : '新增模型' }}</text>
        <scroll-view scroll-y class="popup-scroll">
          <view class="form-field">
            <text class="form-field__label">Provider</text>
            <picker :range="providerCodes" :value="providerIndex" @change="onProviderPick">
              <view class="form-field__input picker-input">{{ modelForm.provider || '请选择' }}</view>
            </picker>
          </view>
          <view class="form-field">
            <text class="form-field__label">模型类型</text>
            <picker :range="modelTypeLabels" :value="modelTypeIndex" @change="onModelTypePick">
              <view class="form-field__input picker-input">{{ modelTypeLabels[modelTypeIndex] }}</view>
            </picker>
          </view>
          <view class="form-field">
            <text class="form-field__label">模型 ID</text>
            <picker
              v-if="!modelForm.id"
              :range="modelOptionLabels"
              :value="modelOptionIndex"
              :disabled="!modelOptionLabels.length"
              @change="onModelNamePickEvent"
            >
              <view class="form-field__input picker-input">
                {{ modelForm.model_name || (modelOptionLabels.length ? '请选择' : '暂无预设模型') }}
              </view>
            </picker>
            <view v-else class="form-field__input picker-input picker-input--disabled">{{ modelForm.model_name }}</view>
            <text v-if="!modelForm.id && !modelOptionLabels.length" class="settings-hint">
              当前 Provider 与模型类型下暂无预设模型，请切换 Provider 或类型。
            </text>
          </view>
          <view class="form-field">
            <text class="form-field__label">显示名称</text>
            <input v-model="modelForm.display_name" class="form-field__input" placeholder="可选" />
          </view>
          <view class="form-field">
            <text class="form-field__label">优先级</text>
            <input v-model="modelForm.priorityText" class="form-field__input" type="number" />
          </view>
          <view class="settings-row">
            <text class="settings-row__label">启用</text>
            <switch :checked="modelForm.status === 1" @change="onModelStatusChange" />
          </view>
          <view class="form-field">
            <text class="form-field__label">API Base（可选）</text>
            <input v-model="modelForm.api_base_url" class="form-field__input" placeholder="留空用 Provider 默认" />
          </view>
          <view class="form-field">
            <text class="form-field__label">API Key（可选）</text>
            <input v-model="modelForm.api_key" class="form-field__input" password placeholder="留空用 Provider 密钥" />
          </view>
        </scroll-view>
        <button class="btn-primary" :disabled="submitting" @tap="submitModel">保存</button>
      </view>
    </view>

    <!-- Prompt 弹窗 -->
    <view v-if="promptDialogVisible" class="popup-mask" @tap="promptDialogVisible = false">
      <view class="popup-panel popup-panel--tall" @tap.stop>
        <text class="popup-panel__title">新建 Prompt 版本</text>
        <scroll-view scroll-y class="popup-scroll">
          <view class="form-field">
            <text class="form-field__label">场景</text>
            <picker :range="promptSceneNames" :value="promptSceneIndex" @change="onPromptScenePick">
              <view class="form-field__input picker-input">{{ promptSceneNames[promptSceneIndex] || 'default' }}</view>
            </picker>
          </view>
          <view class="form-field">
            <text class="form-field__label">名称</text>
            <input v-model="promptForm.name" class="form-field__input" />
          </view>
          <view class="form-field">
            <text class="form-field__label">System Prompt</text>
            <textarea v-model="promptForm.system_prompt" class="form-field__textarea" maxlength="20000" />
          </view>
          <view class="form-field">
            <text class="form-field__label">说明</text>
            <input v-model="promptForm.description" class="form-field__input" />
          </view>
          <view class="settings-row">
            <text class="settings-row__label">保存后立即生效</text>
            <switch :checked="promptForm.is_active === 1" @change="onPromptActiveChange" />
          </view>
        </scroll-view>
        <button class="btn-primary" :disabled="submitting" @tap="submitPrompt">保存</button>
      </view>
    </view>

    <!-- Prompt 预览 -->
    <view v-if="promptPreviewVisible" class="popup-mask" @tap="promptPreviewVisible = false">
      <view class="popup-panel popup-panel--tall" @tap.stop>
        <text class="popup-panel__title">{{ promptPreview?.name || 'Prompt' }}</text>
        <scroll-view scroll-y class="popup-scroll">
          <text class="preview-meta">场景 {{ sceneName(promptPreview?.scene || '') }} · v{{ promptPreview?.version }}</text>
          <text class="preview-content">{{ promptPreview?.system_prompt }}</text>
        </scroll-view>
      </view>
    </view>

    <!-- 敏感词弹窗 -->
    <view v-if="sensitiveDialogVisible" class="popup-mask" @tap="sensitiveDialogVisible = false">
      <view class="popup-panel" @tap.stop>
        <text class="popup-panel__title">{{ sensitiveForm.id ? '编辑敏感词' : '新增敏感词' }}</text>
        <view class="form-field">
          <text class="form-field__label">敏感词</text>
          <input v-model="sensitiveForm.word" class="form-field__input" />
        </view>
        <view class="form-field">
          <text class="form-field__label">级别</text>
          <picker :range="levelLabels" :value="levelIndex" @change="onLevelPick">
            <view class="form-field__input picker-input">{{ levelLabels[levelIndex] }}</view>
          </picker>
        </view>
        <view class="form-field">
          <text class="form-field__label">匹配模式</text>
          <picker :range="matchModeLabels" :value="matchModeIndex" @change="onMatchModePick">
            <view class="form-field__input picker-input">{{ matchModeLabels[matchModeIndex] }}</view>
          </picker>
        </view>
        <view class="form-field">
          <text class="form-field__label">替换文本</text>
          <input v-model="sensitiveForm.replacement" class="form-field__input" />
        </view>
        <view class="settings-row">
          <text class="settings-row__label">启用</text>
          <switch :checked="sensitiveForm.status === 1" @change="onSensitiveStatusChange" />
        </view>
        <button class="btn-primary" :disabled="submitting" @tap="submitSensitive">保存</button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { onLoad, onPullDownRefresh, onShow } from '@dcloudio/uni-app';
import {
  activateAiPrompt,
  aiLearningSettings,
  aiPromptScenes,
  deleteSensitiveWord,
  fetchAiModels,
  fetchAiPrompts,
  fetchAiProviders,
  fetchSensitiveWords,
  saveAiLearningSettings,
  saveAiModel,
  saveAiPrompt,
  saveSensitiveWord,
} from '@/api/tenant';
import type {
  PromptSceneItem,
  TenantAiModelItem,
  TenantAiPromptItem,
  TenantAiProviderOption,
  TenantSensitiveWordItem,
} from '@/types/api';
import { ensureAiSettings } from '@/composables/useAccessGuard';
import { useAiModelCatalog } from '@/composables/useAiModelCatalog';
import { usePermissions } from '@/composables/usePermissions';
import { confirm, toast, toastSuccess, useThemeClass } from '@/composables/useApp';

type AiTab = 'models' | 'prompts' | 'sensitive' | 'review';

const themeClass = useThemeClass();
const { canManageModels, canManagePrompts, canManageSensitive, canManageReview } = usePermissions();

const loading = ref(false);
const submitting = ref(false);
const reviewSaving = ref(false);
const activeTab = ref<AiTab>('models');

const tenantModels = ref<TenantAiModelItem[]>([]);
const platformTemplates = ref<TenantAiModelItem[]>([]);
const modelAvailability = ref<{ chat: boolean; vision: boolean; embedding: boolean } | null>(null);
const providers = ref<TenantAiProviderOption[]>([]);
const prompts = ref<TenantAiPromptItem[]>([]);
const promptScenes = ref<PromptSceneItem[]>([]);
const promptSceneFilter = ref('');
const sensitiveWords = ref<TenantSensitiveWordItem[]>([]);

const modelDialogVisible = ref(false);
const promptDialogVisible = ref(false);
const promptPreviewVisible = ref(false);
const sensitiveDialogVisible = ref(false);
const promptPreview = ref<TenantAiPromptItem | null>(null);

const modelForm = reactive({
  id: 0,
  provider: '',
  model_name: '',
  display_name: '',
  model_type: 1,
  api_base_url: '',
  api_key: '',
  priorityText: '0',
  status: 1,
});

const promptForm = reactive({
  scene: 'default',
  name: '',
  system_prompt: '',
  description: '',
  is_active: 0,
});

const sensitiveForm = reactive({
  id: 0,
  word: '',
  category: 'custom',
  level: 1,
  match_mode: 1,
  replacement: '***',
  status: 1,
});

const reviewForm = reactive({
  qa_auto_review: false,
  qa_extract_threshold: 90,
});

const {
  modelOptionLabels,
  modelOptionIndex,
  syncModelNameFromCatalog,
  onProviderChange,
  onModelTypeChange,
  onModelNamePick,
} = useAiModelCatalog(providers, modelForm);

const modelTypeLabels = ['文本', '多模态', 'Embedding'];
const levelLabels = ['警告', '拦截', '脱敏'];
const matchModeLabels = ['精确', '模糊', '正则'];

const visibleTabs = computed(() => {
  const tabs: Array<{ key: AiTab; label: string }> = [];
  if (canManageModels.value) tabs.push({ key: 'models', label: '模型' });
  if (canManagePrompts.value) tabs.push({ key: 'prompts', label: 'Prompt' });
  if (canManageSensitive.value) tabs.push({ key: 'sensitive', label: '敏感词' });
  if (canManageReview.value) tabs.push({ key: 'review', label: '审核设置' });
  return tabs;
});

const providerCodes = computed(() => providers.value.map((item) => item.code));
const providerIndex = computed(() => Math.max(0, providerCodes.value.indexOf(modelForm.provider)));
const modelTypeIndex = computed(() => Math.max(0, Math.min(2, modelForm.model_type - 1)));

const promptSceneNames = computed(() => promptScenes.value.map((item) => item.name));
const promptSceneIndex = computed(() => {
  const idx = promptScenes.value.findIndex((item) => item.code === promptForm.scene);
  return idx >= 0 ? idx : 0;
});

const sceneFilterLabels = computed(() => ['全部场景', ...promptScenes.value.map((item) => item.name)]);
const sceneFilterIndex = computed(() => {
  if (!promptSceneFilter.value) return 0;
  const idx = promptScenes.value.findIndex((item) => item.code === promptSceneFilter.value);
  return idx >= 0 ? idx + 1 : 0;
});

const levelIndex = computed(() => Math.max(0, Math.min(2, sensitiveForm.level - 1)));
const matchModeIndex = computed(() => Math.max(0, Math.min(2, sensitiveForm.match_mode - 1)));

const modelAvailabilitySummary = computed(() => {
  if (!modelAvailability.value) return '';
  const parts = [
    `对话 ${modelAvailability.value.chat ? '可用' : '不可用'}`,
    `Vision ${modelAvailability.value.vision ? '可用' : '不可用'}`,
    `Embedding ${modelAvailability.value.embedding ? '可用' : '不可用'}`,
  ];
  return `运行时：${parts.join(' · ')}`;
});

function modelTypeLabel(type: number): string {
  if (type === 2) return '多模态';
  if (type === 3) return 'Embedding';
  return '文本';
}

function levelLabel(level: number): string {
  return levelLabels[Math.max(0, Math.min(2, level - 1))] || '警告';
}

function matchModeLabel(mode: number): string {
  return matchModeLabels[Math.max(0, Math.min(2, mode - 1))] || '精确';
}

function sceneName(code: string): string {
  return promptScenes.value.find((item) => item.code === code)?.name || code;
}

function resolveDefaultTab(): AiTab {
  if (canManageModels.value) return 'models';
  if (canManagePrompts.value) return 'prompts';
  if (canManageSensitive.value) return 'sensitive';
  if (canManageReview.value) return 'review';
  return 'models';
}

function switchTab(tab: AiTab) {
  activeTab.value = tab;
  loadActiveTab();
}

async function loadModels() {
  const [modelPayload, providerRows] = await Promise.all([fetchAiModels(), fetchAiProviders()]);
  tenantModels.value = modelPayload.tenant_models;
  platformTemplates.value = modelPayload.platform_templates;
  modelAvailability.value = modelPayload.availability;
  providers.value = providerRows;
}

async function loadPrompts() {
  if (promptScenes.value.length === 0) {
    promptScenes.value = await aiPromptScenes();
  }
  prompts.value = await fetchAiPrompts(promptSceneFilter.value || undefined);
}

async function loadSensitiveWords() {
  sensitiveWords.value = await fetchSensitiveWords();
}

async function loadReviewSettings() {
  const data = await aiLearningSettings();
  reviewForm.qa_auto_review = data.qa_auto_review;
  reviewForm.qa_extract_threshold = data.qa_extract_threshold;
}

function onAutoReviewChange(e: Event) {
  const detail = (e as { detail?: { value?: boolean } }).detail;
  reviewForm.qa_auto_review = Boolean(detail?.value);
}

function onThresholdChange(e: Event) {
  const detail = (e as { detail?: { value?: number } }).detail;
  if (typeof detail?.value === 'number') {
    reviewForm.qa_extract_threshold = detail.value;
  }
}

async function saveReviewSettings() {
  reviewSaving.value = true;
  try {
    const data = await saveAiLearningSettings({
      qa_auto_review: reviewForm.qa_auto_review,
      qa_extract_threshold: reviewForm.qa_extract_threshold,
    });
    reviewForm.qa_auto_review = data.qa_auto_review;
    reviewForm.qa_extract_threshold = data.qa_extract_threshold;
    toastSuccess('设置已保存');
  } finally {
    reviewSaving.value = false;
  }
}

async function loadActiveTab() {
  loading.value = true;
  try {
    if (activeTab.value === 'models' && canManageModels.value) {
      await loadModels();
    } else if (activeTab.value === 'prompts' && canManagePrompts.value) {
      await loadPrompts();
    } else if (activeTab.value === 'sensitive' && canManageSensitive.value) {
      await loadSensitiveWords();
    } else if (activeTab.value === 'review' && canManageReview.value) {
      await loadReviewSettings();
    }
  } finally {
    loading.value = false;
    uni.stopPullDownRefresh();
  }
}

function onScrollLower() {
  // 列表暂无分页
}

function onSceneFilterChange(e: Event) {
  const index = Number((e as { detail?: { value?: number } }).detail?.value ?? 0);
  promptSceneFilter.value = index <= 0 ? '' : (promptScenes.value[index - 1]?.code || '');
  loadPrompts();
}

function openModelDialog(row?: TenantAiModelItem) {
  if (row && row.editable === false) {
    return;
  }
  modelForm.id = row?.id || 0;
  modelForm.provider = row?.provider || providerCodes.value[0] || '';
  modelForm.model_name = row?.model_name || '';
  modelForm.display_name = row?.display_name || '';
  modelForm.model_type = row?.model_type || 1;
  modelForm.api_base_url = row?.api_base_url || '';
  modelForm.api_key = '';
  modelForm.priorityText = String(row?.priority ?? 0);
  modelForm.status = row?.status ?? 1;
  if (!modelForm.id) {
    syncModelNameFromCatalog();
  }
  modelDialogVisible.value = true;
}

function onProviderPick(e: Event) {
  const index = Number((e as { detail?: { value?: number } }).detail?.value ?? 0);
  modelForm.provider = providerCodes.value[index] || '';
  onProviderChange();
}

function onModelTypePick(e: Event) {
  const index = Number((e as { detail?: { value?: number } }).detail?.value ?? 0);
  modelForm.model_type = index + 1;
  onModelTypeChange();
}

function onModelNamePickEvent(e: Event) {
  const index = Number((e as { detail?: { value?: number } }).detail?.value ?? 0);
  onModelNamePick(index);
}

function onModelStatusChange(e: Event) {
  modelForm.status = (e as { detail?: { value?: boolean } }).detail?.value ? 1 : 0;
}

async function submitModel() {
  if (!modelForm.provider || !modelForm.model_name.trim()) {
    toast('请填写 Provider 与模型 ID');
    return;
  }
  submitting.value = true;
  try {
    const payload: Parameters<typeof saveAiModel>[0] = {
      provider: modelForm.provider,
      model_name: modelForm.model_name.trim(),
      display_name: modelForm.display_name.trim() || modelForm.model_name.trim(),
      model_type: modelForm.model_type,
      api_base_url: modelForm.api_base_url.trim(),
      priority: Number(modelForm.priorityText) || 0,
      status: modelForm.status,
    };
    if (modelForm.id > 0) payload.id = modelForm.id;
    if (modelForm.api_key.trim()) payload.api_key = modelForm.api_key.trim();
    await saveAiModel(payload);
    toastSuccess('模型已保存');
    modelDialogVisible.value = false;
    await loadModels();
  } finally {
    submitting.value = false;
  }
}

function openPromptDialog() {
  promptForm.scene = promptSceneFilter.value || 'default';
  promptForm.name = '';
  promptForm.system_prompt = '';
  promptForm.description = '';
  promptForm.is_active = 0;
  promptDialogVisible.value = true;
}

function onPromptScenePick(e: Event) {
  const index = Number((e as { detail?: { value?: number } }).detail?.value ?? 0);
  promptForm.scene = promptScenes.value[index]?.code || 'default';
}

function onPromptActiveChange(e: Event) {
  promptForm.is_active = (e as { detail?: { value?: boolean } }).detail?.value ? 1 : 0;
}

async function submitPrompt() {
  if (!promptForm.scene || !promptForm.name.trim() || !promptForm.system_prompt.trim()) {
    toast('请填写场景、名称与 System Prompt');
    return;
  }
  submitting.value = true;
  try {
    await saveAiPrompt({
      scene: promptForm.scene,
      name: promptForm.name.trim(),
      system_prompt: promptForm.system_prompt.trim(),
      description: promptForm.description.trim(),
      is_active: promptForm.is_active,
    });
    toastSuccess('Prompt 已保存');
    promptDialogVisible.value = false;
    await loadPrompts();
  } finally {
    submitting.value = false;
  }
}

function openPromptPreview(row: TenantAiPromptItem) {
  promptPreview.value = row;
  promptPreviewVisible.value = true;
}

async function activatePrompt(row: TenantAiPromptItem) {
  await activateAiPrompt(row.id);
  toastSuccess('已设为生效');
  await loadPrompts();
}

function openSensitiveDialog(row?: TenantSensitiveWordItem) {
  sensitiveForm.id = row?.id || 0;
  sensitiveForm.word = row?.word || '';
  sensitiveForm.category = row?.category || 'custom';
  sensitiveForm.level = row?.level ?? 1;
  sensitiveForm.match_mode = row?.match_mode ?? 1;
  sensitiveForm.replacement = row?.replacement || '***';
  sensitiveForm.status = row?.status ?? 1;
  sensitiveDialogVisible.value = true;
}

function onLevelPick(e: Event) {
  const index = Number((e as { detail?: { value?: number } }).detail?.value ?? 0);
  sensitiveForm.level = index + 1;
}

function onMatchModePick(e: Event) {
  const index = Number((e as { detail?: { value?: number } }).detail?.value ?? 0);
  sensitiveForm.match_mode = index + 1;
}

function onSensitiveStatusChange(e: Event) {
  sensitiveForm.status = (e as { detail?: { value?: boolean } }).detail?.value ? 1 : 0;
}

async function submitSensitive() {
  if (!sensitiveForm.word.trim()) {
    toast('请填写敏感词');
    return;
  }
  submitting.value = true;
  try {
    const payload: Parameters<typeof saveSensitiveWord>[0] = {
      word: sensitiveForm.word.trim(),
      category: sensitiveForm.category,
      level: sensitiveForm.level,
      match_mode: sensitiveForm.match_mode,
      replacement: sensitiveForm.replacement,
      status: sensitiveForm.status,
    };
    if (sensitiveForm.id > 0) payload.id = sensitiveForm.id;
    await saveSensitiveWord(payload);
    toastSuccess('敏感词已保存');
    sensitiveDialogVisible.value = false;
    await loadSensitiveWords();
  } finally {
    submitting.value = false;
  }
}

async function removeSensitive(row: TenantSensitiveWordItem) {
  const ok = await confirm('确认删除', `确定删除敏感词「${row.word}」？`);
  if (!ok) return;
  await deleteSensitiveWord(row.id);
  toastSuccess('已删除');
  await loadSensitiveWords();
}

onLoad((options) => {
  const tab = String(options?.tab || '');
  if (tab === 'models' || tab === 'prompts' || tab === 'sensitive' || tab === 'review') {
    activeTab.value = tab;
  }
});

onShow(() => {
  if (!ensureAiSettings()) return;
  if (!visibleTabs.value.some((item) => item.key === activeTab.value)) {
    activeTab.value = resolveDefaultTab();
  }
  loadActiveTab();
});

onPullDownRefresh(() => {
  if (!ensureAiSettings()) {
    uni.stopPullDownRefresh();
    return;
  }
  loadActiveTab();
});
</script>

<style scoped lang="scss">
.ai-settings-page {
  min-height: 100vh;
}

.tab-bar {
  white-space: nowrap;
  background: var(--cs-bg-elevated);
  border-bottom: 1px solid var(--cs-divider);
}

.tab-bar__inner {
  display: inline-flex;
  padding: 8px 12px;
  gap: 8px;
}

.tab-item {
  padding: 8px 14px;
  border-radius: var(--cs-radius-full);
  background: var(--cs-bg-subtle);
  font-size: 13px;
  color: var(--cs-text-secondary);

  &--active {
    background: var(--cs-primary-soft);
    color: var(--cs-primary);
    font-weight: 600;
  }
}

.scroll-body {
  height: calc(100vh - 44px - 48px);
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 12px;
}

.filter-picker {
  padding: 8px 12px;
  border-radius: var(--cs-radius-md);
  background: var(--cs-bg-elevated);
  border: 1px solid var(--cs-divider);
  font-size: 13px;
  color: var(--cs-text-primary);
}

.item-card {
  margin: 0 12px 10px;
  padding: 12px;
}

.item-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.item-card__title {
  font-size: 15px;
  font-weight: 600;
  color: var(--cs-text-primary);
}

.item-card__tag {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: var(--cs-radius-full);

  &.is-on {
    background: rgba(0, 180, 42, 0.12);
    color: var(--cs-success, #00b42a);
  }

  &.is-off {
    background: var(--cs-bg-subtle);
    color: var(--cs-text-muted);
  }

  &.item-card__tag--platform {
    background: rgba(22, 93, 255, 0.1);
    color: var(--cs-primary, #165dff);
  }
}

.item-card--readonly {
  opacity: 0.92;
}

.availability-banner {
  margin: 0 0 12px;
  padding: 10px 12px;
  border-radius: var(--cs-radius-md);
  background: var(--cs-bg-subtle);
  font-size: 12px;
  color: var(--cs-text-secondary);
  line-height: 1.5;
}

.section-title {
  margin: 16px 0 8px;
  font-size: 14px;
  font-weight: 600;
  color: var(--cs-text-primary);
}

.section-title--platform {
  margin-top: 20px;
}

.item-card__meta {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  color: var(--cs-text-muted);
}

.item-card__actions {
  display: flex;
  gap: 8px;
  margin-top: 10px;
}

.popup-panel--tall {
  max-height: 82vh;
}

.popup-scroll {
  max-height: 52vh;
  margin-bottom: 12px;
}

.picker-input {
  display: flex;
  align-items: center;
  min-height: 40px;

  &--disabled {
    color: var(--cs-text-muted);
  }
}

.settings-desc {
  display: block;
  padding: 0 0 12px;
  font-size: 13px;
  line-height: 1.6;
  color: var(--cs-text-secondary);
}

.settings-hint {
  display: block;
  padding: 0 0 12px;
  font-size: 12px;
  line-height: 1.5;
  color: var(--cs-text-muted);
}

.save-btn {
  margin-top: 8px;
}

.settings-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0 12px;
}

.settings-row__label {
  font-size: 14px;
  color: var(--cs-text-primary);
}

.preview-meta {
  display: block;
  margin-bottom: 8px;
  font-size: 12px;
  color: var(--cs-text-muted);
}

.preview-content {
  display: block;
  font-size: 13px;
  line-height: 1.6;
  color: var(--cs-text-primary);
  white-space: pre-wrap;
}
</style>
