<template>
  <view class="page page-with-nav agents-page" :class="themeClass">
    <view class="toolbar">
      <input
        v-model="keyword"
        class="search-input"
        placeholder="搜索账号/昵称"
        confirm-type="search"
        @confirm="loadData(1)"
      />
      <button class="btn-primary mini-btn" :disabled="!canCreate" @tap="openCreate">新建客服</button>
    </view>
    <view v-if="seatQuota.seat_limit > 0" class="quota-hint">
      <text>工位 {{ seatQuota.seat_used }}/{{ seatQuota.seat_limit }}</text>
    </view>

    <scroll-view scroll-y class="scroll-body" @scrolltolower="loadMore">
      <view v-for="row in rows" :key="row.id" class="agent-card">
        <view class="agent-card__head">
          <text class="agent-card__name">{{ row.nickname || row.username }}</text>
          <text class="agent-card__status" :class="row.status === 1 ? 'is-on' : 'is-off'">
            {{ row.status === 1 ? '启用' : '禁用' }}
          </text>
        </view>
        <text class="agent-card__meta">账号 {{ row.username }}</text>
        <text v-if="row.shops?.length" class="agent-card__shops">
          店铺：{{ row.shops.map((s) => s.shop_name).join('、') }}
        </text>
        <view class="agent-card__actions">
          <button class="btn-plain mini-btn" @tap="openEdit(row)">编辑</button>
          <button
            v-if="row.status === 1"
            class="btn-danger-plain mini-btn"
            @tap="toggleStatus(row, 0)"
          >
            禁用
          </button>
          <button v-else class="btn-primary mini-btn" :disabled="!canCreate" @tap="toggleStatus(row, 1)">
            启用
          </button>
        </view>
      </view>
      <view v-if="rows.length === 0 && !loading" class="empty-box">暂无客服</view>
    </scroll-view>

    <view v-if="dialogVisible" class="popup-mask" @tap="dialogVisible = false">
      <view class="popup-panel" @tap.stop>
        <text class="popup-panel__title">{{ dialogMode === 'create' ? '新建客服' : '编辑客服' }}</text>
        <view v-if="dialogMode === 'create'" class="form-field">
          <text class="form-field__label">登录账号</text>
          <input v-model="form.username" class="form-field__input" placeholder="必填" />
        </view>
        <view class="form-field">
          <text class="form-field__label">{{ dialogMode === 'create' ? '密码' : '新密码（留空不改）' }}</text>
          <input v-model="form.password" class="form-field__input" password placeholder="至少 6 位" />
        </view>
        <view class="form-field">
          <text class="form-field__label">昵称</text>
          <input v-model="form.nickname" class="form-field__input" placeholder="展示名称" />
        </view>
        <view class="form-field">
          <text class="form-field__label">手机号</text>
          <input v-model="form.phone" class="form-field__input" />
        </view>
        <view class="form-field">
          <text class="form-field__label">邮箱</text>
          <input v-model="form.email" class="form-field__input" />
        </view>
        <view class="form-field">
          <text class="form-field__label">负责店铺 ID（逗号分隔）</text>
          <input v-model="shopIdsText" class="form-field__input" placeholder="如 1,2" />
        </view>
        <button class="btn-primary" :disabled="submitting" @tap="submitForm">保存</button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { onPullDownRefresh, onShow } from '@dcloudio/uni-app';
import {
  agents,
  createAgent,
  updateAgent,
  updateAgentStatus,
} from '@/api/tenant';
import type { AgentItem, AgentSeatQuota } from '@/types/api';
import { ensurePermission } from '@/composables/useAccessGuard';
import { confirm, toast, toastSuccess, useThemeClass } from '@/composables/useApp';

const themeClass = useThemeClass();
const loading = ref(false);
const submitting = ref(false);
const rows = ref<AgentItem[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = 20;
const keyword = ref('');
const seatQuota = ref<AgentSeatQuota>({ seat_limit: 0, seat_used: 0, seat_available: null });

const dialogVisible = ref(false);
const dialogMode = ref<'create' | 'edit'>('create');
const editingId = ref(0);
const shopIdsText = ref('');

const form = reactive({
  username: '',
  password: '',
  nickname: '',
  phone: '',
  email: '',
});

const canCreate = computed(() => {
  if (seatQuota.value.seat_limit <= 0) return true;
  return (seatQuota.value.seat_available ?? 0) > 0;
});

const finished = computed(() => rows.value.length >= total.value);

function parseShopIds(): number[] {
  return shopIdsText.value
    .split(/[,，\s]+/)
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isFinite(n) && n > 0);
}

function resetForm() {
  form.username = '';
  form.password = '';
  form.nickname = '';
  form.phone = '';
  form.email = '';
  shopIdsText.value = '';
  editingId.value = 0;
}

async function loadData(nextPage = 1) {
  loading.value = true;
  page.value = nextPage;
  try {
    const result = await agents({
      page: page.value,
      page_size: pageSize,
      keyword: keyword.value.trim(),
    });
    if (nextPage === 1) {
      rows.value = result.list;
    } else {
      rows.value = [...rows.value, ...result.list];
    }
    total.value = result.total;
    seatQuota.value = result.seat_quota;
  } finally {
    loading.value = false;
    uni.stopPullDownRefresh();
  }
}

function loadMore() {
  if (loading.value || finished.value) return;
  loadData(page.value + 1);
}

function openCreate() {
  if (!canCreate.value) {
    toast('客服工位已满，请前往计费中心增购席位');
    return;
  }
  dialogMode.value = 'create';
  resetForm();
  dialogVisible.value = true;
}

function openEdit(row: AgentItem) {
  dialogMode.value = 'edit';
  editingId.value = row.id;
  form.username = row.username;
  form.password = '';
  form.nickname = row.nickname;
  form.phone = row.phone || '';
  form.email = row.email || '';
  shopIdsText.value = (row.shop_ids || []).join(',');
  dialogVisible.value = true;
}

async function submitForm() {
  if (dialogMode.value === 'create') {
    if (!form.username.trim()) {
      toast('登录账号必填');
      return;
    }
    if (form.password.length < 6) {
      toast('密码至少 6 位');
      return;
    }
  }
  if (!form.nickname.trim()) {
    toast('昵称必填');
    return;
  }

  submitting.value = true;
  try {
    const shop_ids = parseShopIds();
    if (dialogMode.value === 'create') {
      await createAgent({
        username: form.username.trim(),
        password: form.password,
        nickname: form.nickname.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        shop_ids,
      });
      toastSuccess('客服创建成功');
    } else {
      await updateAgent(editingId.value, {
        nickname: form.nickname.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        password: form.password || undefined,
        shop_ids,
      });
      toastSuccess('客服信息已更新');
    }
    dialogVisible.value = false;
    await loadData(1);
  } finally {
    submitting.value = false;
  }
}

async function toggleStatus(row: AgentItem, status: number) {
  const action = status === 1 ? '启用' : '禁用';
  if (status === 0 && !(await confirm(`${action}确认`, `确定${action}客服「${row.nickname || row.username}」吗？`))) {
    return;
  }
  if (status === 1 && !canCreate.value) {
    toast('客服工位已满，无法启用');
    return;
  }
  await updateAgentStatus(row.id, status);
  toastSuccess(`客服已${action}`);
  await loadData(page.value);
}

onShow(() => {
  if (!ensurePermission('user:manage')) return;
  loadData(1);
});

onPullDownRefresh(() => {
  if (!ensurePermission('user:manage')) {
    uni.stopPullDownRefresh();
    return;
  }
  loadData(1);
});
</script>

<style scoped lang="scss">
.agents-page {
  min-height: 100vh;
}

.toolbar {
  display: flex;
  gap: 8px;
  padding: 8px 12px;
  align-items: center;
}

.search-input {
  flex: 1;
  height: 36px;
  padding: 0 12px;
  background: var(--cs-bg-elevated);
  border: 1px solid var(--cs-divider);
  border-radius: var(--cs-radius-md);
  font-size: 14px;
}

.quota-hint {
  padding: 0 16px 8px;
  font-size: 12px;
  color: var(--cs-text-muted);
}

.scroll-body {
  height: calc(100vh - 120px);
}

.agent-card {
  margin: 0 12px 10px;
  padding: 12px 14px;
  background: var(--cs-bg-elevated);
  border-radius: var(--cs-radius-lg);
  border: 1px solid var(--cs-divider);
}

.agent-card__head {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.agent-card__name {
  font-size: 15px;
  font-weight: 600;
}

.agent-card__status {
  font-size: 12px;

  &.is-on { color: var(--cs-success, #00b42a); }
  &.is-off { color: var(--cs-text-muted); }
}

.agent-card__meta,
.agent-card__shops {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  color: var(--cs-text-muted);
}

.agent-card__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}
</style>
