<template>

  <view class="page page-tab" :class="themeClass">

    <PageHeader title="工作台" description="会话列表 · AI 协同接待" />

    <view class="inbox-stats">

      <view class="inbox-stat inbox-stat--blue">

        <text class="inbox-stat__value">{{ stats.total }}</text>

        <text class="inbox-stat__label">全部</text>

      </view>

      <view class="inbox-stat inbox-stat--amber">

        <text class="inbox-stat__value">{{ stats.manual }}</text>

        <text class="inbox-stat__label">人工</text>

      </view>

      <view class="inbox-stat inbox-stat--red">

        <text class="inbox-stat__value">{{ stats.blocked }}</text>

        <text class="inbox-stat__label">阻断</text>

      </view>

    </view>

    <view class="search-field">

      <text class="search-field__icon">⌕</text>

      <input

        v-model="keyword"

        class="search-bar"

        placeholder="搜索客户、平台 ID..."

        confirm-type="search"

        @confirm="onRefresh"

      />

    </view>

    <view class="segmented">

      <text

        v-for="chip in filterOptions"

        :key="String(chip.value)"

        class="filter-chip"

        :class="{ 'filter-chip--active': hostingFilter === chip.value }"

        @tap="setFilter(chip.value)"

      >{{ chip.label }}</text>

    </view>

    <view class="list-panel">

      <scroll-view scroll-y class="scroll-body" @scrolltolower="loadMore">

        <SessionCard v-for="item in filteredSessions" :key="item.id" :session="item" @tap="goChat(item.id)" />

        <view v-if="!loading && filteredSessions.length === 0" class="empty-box">

          <view class="empty-box__icon">💬</view>

          <text class="empty-box__title">暂无会话</text>

          <text class="empty-box__desc">客户咨询将在这里实时出现</text>

        </view>

        <view v-if="loading" class="empty-box">加载中...</view>

      </scroll-view>

    </view>

    <TabBarHost />

  </view>

</template>



<script setup lang="ts">

import { computed, ref } from 'vue';

import { onPullDownRefresh, onShow } from '@dcloudio/uni-app';

import PageHeader from '@/components/PageHeader.vue';

import TabBarHost from '@/components/TabBarHost.vue';

import SessionCard from '@/components/SessionCard.vue';

import { messageDashboard } from '@/api/tenant';

import type { SessionItem } from '@/types/api';

import { ensurePermission } from '@/composables/useAccessGuard';

import { goChat, useThemeClass } from '@/composables/useApp';

import { initTabBar } from '@/composables/useTabBar';

const themeClass = useThemeClass();

const keyword = ref('');

const hostingFilter = ref<number | null>(null);

const sessions = ref<SessionItem[]>([]);

const totalCount = ref(0);

const loading = ref(false);

const finished = ref(false);

const page = ref(1);



const filterOptions = [

  { label: '全部', value: null as number | null },

  { label: '人工', value: 0 },

  { label: '审核', value: 1 },

  { label: '托管', value: 2 },

];



const filteredSessions = computed(() => {

  if (hostingFilter.value === null) return sessions.value;

  return sessions.value.filter((s) => s.hosting_mode === hostingFilter.value);

});



const stats = computed(() => ({

  total: totalCount.value || sessions.value.length,

  manual: sessions.value.filter((s) => s.hosting_mode === 0).length,

  blocked: sessions.value.filter((s) => s.ai_blocked === 1).length,

}));



function setFilter(value: number | null) {

  hostingFilter.value = value;

}



async function fetchPage(reset = false) {

  if (reset) {

    page.value = 1;

    finished.value = false;

    sessions.value = [];

  }

  if (finished.value && !reset) return;

  loading.value = true;

  try {

    const result = await messageDashboard({

      page: page.value,

      page_size: 15,

      keyword: keyword.value.trim() || undefined,

    });

    sessions.value = reset ? result.list : [...sessions.value, ...result.list];

    totalCount.value = result.total;

    finished.value = sessions.value.length >= result.total;

    if (!finished.value) page.value += 1;

  } finally {

    loading.value = false;

    uni.stopPullDownRefresh();

  }

}



function onRefresh() {

  fetchPage(true);

}



function loadMore() {

  if (!loading.value && !finished.value) fetchPage(false);

}



onShow(() => {

  initTabBar();

  if (!ensurePermission('session:view')) return;

  fetchPage(true);

});



onPullDownRefresh(() => fetchPage(true));

</script>



<style scoped lang="scss">

.scroll-body {

  max-height: calc(100vh - 280px);

}

</style>


