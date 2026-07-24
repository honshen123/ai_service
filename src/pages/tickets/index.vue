<template>

  <view class="page page-tab" :class="themeClass">

    <PageHeader title="工单" description="问题跟踪与 SLA 响应" :show-brand="false">

      <template #action>

        <button class="btn-primary header-btn" @tap="showCreate = true">新建</button>

      </template>

    </PageHeader>

    <view class="search-field">

      <text class="search-field__icon">⌕</text>

      <input v-model="keyword" class="search-bar" placeholder="搜索工单号 / 标题" @confirm="onRefresh" />

    </view>

    <view class="segmented">

      <text

        v-for="chip in statusFilters"

        :key="String(chip.value)"

        class="filter-chip"

        :class="{ 'filter-chip--active': statusFilter === chip.value }"

        @tap="setStatusFilter(chip.value)"

      >{{ chip.label }}</text>

    </view>

    <view class="list-panel">

      <scroll-view scroll-y class="scroll-body" @scrolltolower="loadMore">

        <view v-for="item in tickets" :key="item.id" class="ticket-card" @tap="goTicketDetail(item.id)">

          <view class="ticket-card__head">

            <text class="ticket-card__no">#{{ item.ticket_no }}</text>

            <text class="badge-ticket" :class="'badge-ticket--' + ticketStatusType(item.status)">{{ ticketStatusText(item.status) }}</text>

          </view>

          <text class="ticket-card__title">{{ item.title }}</text>

          <text class="ticket-card__content">{{ item.content || '暂无详细描述' }}</text>

          <view class="ticket-card__foot">

            <text class="ticket-card__meta">{{ ticketPriorityText(item.priority) }} · {{ item.create_time || '' }}</text>

            <button v-if="item.status !== 3 && item.status !== 4" class="btn-primary mini-btn" @tap.stop="resolve(item.id)">解决</button>

          </view>

        </view>

        <view v-if="!loading && tickets.length === 0" class="empty-box">

          <text class="empty-box__title">暂无工单</text>

        </view>

      </scroll-view>

    </view>



    <view v-if="showCreate" class="popup-mask" @tap="showCreate = false">

      <view class="popup-panel" @tap.stop>

        <text class="popup-panel__title">新建工单</text>

        <view class="form-field"><text class="form-field__label">标题</text><input v-model="createForm.title" class="form-field__input" /></view>

        <view class="form-field"><text class="form-field__label">内容</text><textarea v-model="createForm.content" class="form-field__textarea" /></view>

        <button class="btn-primary submit-btn" :loading="creating" @tap="submitCreate">提交工单</button>

      </view>

    </view>

    <TabBarHost />

  </view>

</template>



<script setup lang="ts">

import { reactive, ref } from 'vue';

import { onPullDownRefresh, onShow } from '@dcloudio/uni-app';

import PageHeader from '@/components/PageHeader.vue';

import TabBarHost from '@/components/TabBarHost.vue';

import { createTicket, tickets as fetchTickets, updateTicketStatus } from '@/api/tenant';

import type { TicketItem } from '@/types/api';

import { ticketPriorityText, ticketStatusText, ticketStatusType } from '@/utils/session';

import { ensurePermission } from '@/composables/useAccessGuard';

import { goTicketDetail, toastSuccess, useThemeClass } from '@/composables/useApp';
import { initTabBar } from '@/composables/useTabBar';



const themeClass = useThemeClass();

const keyword = ref('');

const statusFilter = ref<number | undefined>(undefined);

const tickets = ref<TicketItem[]>([]);

const loading = ref(false);

const finished = ref(false);

const page = ref(1);

const showCreate = ref(false);

const creating = ref(false);

const createForm = reactive({ title: '', content: '' });



const statusFilters = [

  { label: '全部', value: undefined as number | undefined },

  { label: '待处理', value: 0 },

  { label: '处理中', value: 1 },

  { label: '已解决', value: 3 },

];



function setStatusFilter(value: number | undefined) {

  statusFilter.value = value;

  fetchPage(true);

}



async function fetchPage(reset = false) {

  if (reset) { page.value = 1; finished.value = false; tickets.value = []; }

  if (finished.value && !reset) return;

  loading.value = true;

  try {

    const result = await fetchTickets({ page: page.value, page_size: 10, keyword: keyword.value.trim() || undefined, status: statusFilter.value });

    tickets.value = reset ? result.list : [...tickets.value, ...result.list];

    finished.value = tickets.value.length >= result.total;

    if (!finished.value) page.value += 1;

  } finally {

    loading.value = false;

    uni.stopPullDownRefresh();

  }

}



function onRefresh() { fetchPage(true); }

function loadMore() { if (!loading.value && !finished.value) fetchPage(false); }



async function resolve(id: number) {

  await updateTicketStatus(id, 3);

  toastSuccess('已标记解决');

  fetchPage(true);

}



async function submitCreate() {

  if (!createForm.title.trim()) return;

  creating.value = true;

  try {

    await createTicket({ title: createForm.title.trim(), content: createForm.content.trim(), priority: 2 });

    toastSuccess('工单已创建');

    showCreate.value = false;

    createForm.title = '';

    createForm.content = '';

    fetchPage(true);

  } finally {

    creating.value = false;

  }

}



onShow(() => {

  initTabBar();

  if (!ensurePermission('ticket:view')) return;

  fetchPage(true);

});

onPullDownRefresh(() => fetchPage(true));

</script>



<style scoped lang="scss">

.header-btn { padding: 6px 14px; font-size: 13px; line-height: 1.4; }

.scroll-body { max-height: calc(100vh - 220px); }

.mini-btn { padding: 4px 12px; font-size: 12px; }

.submit-btn { width: 100%; padding: 12px; margin-top: 4px; }

</style>


