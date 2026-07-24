<template>
  <view class="page page-tab statistics-page" :class="themeClass">
    <PageHeader title="数据洞察" description="近 7 日运营指标" :show-brand="false" />
    <view class="segmented">
      <text
        v-for="tab in tabs"
        :key="tab.key"
        class="filter-chip"
        :class="{ 'filter-chip--active': activeTab === tab.key }"
        @tap="activeTab = tab.key"
      >
        {{ tab.label }}
      </text>
    </view>

    <scroll-view scroll-y class="statistics-scroll">
      <view v-if="activeTab === 'overview'">
        <view v-if="overview" class="wallet-hero">
          <text class="wallet-hero__label">会话总数</text>
          <text class="wallet-hero__value">{{ formatNumber(overview.session_count) }}</text>
          <view class="wallet-hero__grid">
            <view>
              <text class="wallet-hero__item-label">消息</text>
              <text class="wallet-hero__item-value">{{ formatNumber(overview.message_count) }}</text>
            </view>
            <view>
              <text class="wallet-hero__item-label">Token</text>
              <text class="wallet-hero__item-value">{{ formatNumber(overview.token_consumed) }}</text>
            </view>
            <view>
              <text class="wallet-hero__item-label">解决率</text>
              <text class="wallet-hero__item-value">{{ overview.resolution_rate }}%</text>
            </view>
          </view>
        </view>

        <view v-if="overview" class="stat-grid card-block">
          <view class="stat-item">
            <text class="stat-label">AI 回复</text>
            <text class="stat-value stat-value--sm">{{ formatNumber(overview.ai_message_count) }}</text>
          </view>
          <view class="stat-item">
            <text class="stat-label">人工回复</text>
            <text class="stat-value stat-value--sm">{{ formatNumber(overview.human_message_count) }}</text>
          </view>
          <view class="stat-item">
            <text class="stat-label">转人工</text>
            <text class="stat-value stat-value--sm">{{ formatNumber(overview.transfer_human_count) }}</text>
          </view>
          <view class="stat-item">
            <text class="stat-label">AI 均分</text>
            <text class="stat-value stat-value--sm">{{ overview.avg_ai_score.toFixed(1) }}</text>
          </view>
        </view>

        <view v-if="trend.length" class="card-block chart-card">
          <view class="chart-card__head">
            <text class="chart-card__title">会话与消息趋势</text>
            <text class="chart-card__desc">近 7 日走势</text>
          </view>
          <LineChart :labels="chartLabels" :series="sessionMessageSeries" />
        </view>

        <view v-if="trend.length" class="card-block chart-card">
          <view class="chart-card__head">
            <text class="chart-card__title">回复构成</text>
            <text class="chart-card__desc">AI 与人工消息占比</text>
          </view>
          <BarChart :labels="chartLabels" :series="replyBarSeries" />
        </view>

        <view v-if="overview" class="card-block chart-card">
          <view class="chart-card__head">
            <text class="chart-card__title">消息类型分布</text>
            <text class="chart-card__desc">累计回复占比</text>
          </view>
          <DonutChart
            :segments="replyDonutSegments"
            :total-label="formatNumber(overview.message_count)"
            sub-label="消息总量"
          />
        </view>

        <view v-if="trend.length" class="card-block chart-card">
          <view class="chart-card__head">
            <text class="chart-card__title">工单趋势</text>
            <text class="chart-card__desc">新建 vs 已解决</text>
          </view>
          <LineChart :labels="chartLabels" :series="ticketLineSeries" />
        </view>
      </view>

      <view v-if="activeTab === 'channels'">
        <view v-if="channels.length" class="card-block chart-card">
          <view class="chart-card__head">
            <text class="chart-card__title">渠道会话分布</text>
            <text class="chart-card__desc">各平台会话占比</text>
          </view>
          <DonutChart
            :segments="channelDonutSegments"
            :total-label="formatNumber(channelTotal)"
            sub-label="会话总量"
          />
        </view>
        <view class="card-block">
          <text class="section-title">渠道明细</text>
          <view v-for="item in channels" :key="item.platform" class="cell-row">
            <text class="cell-row__title">{{ platformLabel(item.platform) }}</text>
            <text class="cell-row__value">{{ item.session_count }} 会话</text>
          </view>
          <view v-if="channels.length === 0" class="empty-box">暂无渠道数据</view>
        </view>
      </view>

      <view v-if="activeTab === 'quality'">
        <view v-if="quality" class="stat-grid card-block">
          <view class="stat-item">
            <text class="stat-label">质检总数</text>
            <text class="stat-value stat-value--sm">{{ quality.checked_count }}</text>
          </view>
          <view class="stat-item">
            <text class="stat-label">平均分</text>
            <text class="stat-value stat-value--sm">{{ quality.avg_score.toFixed(1) }}</text>
          </view>
          <view class="stat-item">
            <text class="stat-label">高分样本</text>
            <text class="stat-value stat-value--sm">{{ quality.high_score_count }}</text>
          </view>
          <view class="stat-item">
            <text class="stat-label">提取率</text>
            <text class="stat-value stat-value--sm">{{ quality.extract_rate }}%</text>
          </view>
        </view>

        <view v-if="quality" class="card-block chart-card">
          <view class="chart-card__head">
            <text class="chart-card__title">质检结果分布</text>
            <text class="chart-card__desc">高分 vs 其他样本</text>
          </view>
          <DonutChart
            :segments="qualityDonutSegments"
            :total-label="String(quality.checked_count)"
            sub-label="质检样本"
          />
        </view>

        <view v-if="quality" class="card-block chart-card">
          <view class="chart-card__head">
            <text class="chart-card__title">质量指标</text>
            <text class="chart-card__desc">核心比率一览</text>
          </view>
          <view class="metric-list">
            <view class="metric-item">
              <view class="metric-item__head">
                <text class="metric-item__label">平均质检分</text>
                <text class="metric-item__value">{{ quality.avg_score.toFixed(1) }}</text>
              </view>
              <view class="metric-item__track">
                <view class="metric-item__fill metric-item__fill--primary" :style="{ width: scorePercent + '%' }" />
              </view>
            </view>
            <view class="metric-item">
              <view class="metric-item__head">
                <text class="metric-item__label">提取率</text>
                <text class="metric-item__value">{{ quality.extract_rate }}%</text>
              </view>
              <view class="metric-item__track">
                <view class="metric-item__fill metric-item__fill--success" :style="{ width: quality.extract_rate + '%' }" />
              </view>
            </view>
            <view v-if="overview" class="metric-item">
              <view class="metric-item__head">
                <text class="metric-item__label">工单解决率</text>
                <text class="metric-item__value">{{ overview.resolution_rate }}%</text>
              </view>
              <view class="metric-item__track">
                <view class="metric-item__fill metric-item__fill--warning" :style="{ width: overview.resolution_rate + '%' }" />
              </view>
            </view>
          </view>
        </view>
      </view>
    </scroll-view>

    <TabBarHost />
  </view>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { onPullDownRefresh, onShow } from '@dcloudio/uni-app';
import TabBarHost from '@/components/TabBarHost.vue';
import PageHeader from '@/components/PageHeader.vue';
import BarChart from '@/components/charts/BarChart.vue';
import DonutChart from '@/components/charts/DonutChart.vue';
import LineChart from '@/components/charts/LineChart.vue';
import { statisticsChannels, statisticsOverview, statisticsQuality, statisticsTrend } from '@/api/tenant';
import type { StatisticsChannelItem, StatisticsOverview, StatisticsQuality, StatisticsTrendItem } from '@/types/api';
import { formatChartDate } from '@/utils/chart';
import { formatNumber, platformLabel } from '@/utils/session';
import { ensurePermission } from '@/composables/useAccessGuard';
import { useThemeClass } from '@/composables/useApp';
import { initTabBar } from '@/composables/useTabBar';

const themeClass = useThemeClass();
const activeTab = ref('overview');
const tabs = [
  { key: 'overview', label: '概览' },
  { key: 'channels', label: '渠道' },
  { key: 'quality', label: '质检' },
];
const overview = ref<StatisticsOverview | null>(null);
const trend = ref<StatisticsTrendItem[]>([]);
const channels = ref<StatisticsChannelItem[]>([]);
const quality = ref<StatisticsQuality | null>(null);

const channelColors = ['#3370ff', '#7b61ff', '#00b42a', '#ff7d00', '#f53f3f', '#14c9c9', '#86909c'];

const chartLabels = computed(() => trend.value.map((item) => formatChartDate(item.date)));

const sessionMessageSeries = computed(() => [
  { name: '会话', color: '#3370ff', data: trend.value.map((item) => item.session_count) },
  { name: '消息', color: '#7b61ff', data: trend.value.map((item) => item.message_count) },
]);

const replyBarSeries = computed(() => [
  { name: 'AI', color: '#3370ff', data: trend.value.map((item) => item.ai_message_count) },
  { name: '人工', color: '#7b61ff', data: trend.value.map((item) => item.human_message_count) },
]);

const ticketLineSeries = computed(() => [
  { name: '新建', color: '#ff7d00', data: trend.value.map((item) => item.ticket_created_count) },
  { name: '已解决', color: '#00b42a', data: trend.value.map((item) => item.ticket_resolved_count) },
]);

const replyDonutSegments = computed(() => {
  if (!overview.value) return [];
  return [
    { label: 'AI 回复', value: overview.value.ai_message_count, color: '#3370ff' },
    { label: '人工回复', value: overview.value.human_message_count, color: '#7b61ff' },
  ];
});

const channelTotal = computed(() => channels.value.reduce((sum, item) => sum + item.session_count, 0));

const channelDonutSegments = computed(() =>
  channels.value.map((item, index) => ({
    label: platformLabel(item.platform),
    value: item.session_count,
    color: channelColors[index % channelColors.length],
  })),
);

const qualityDonutSegments = computed(() => {
  if (!quality.value) return [];
  const other = Math.max(quality.value.checked_count - quality.value.high_score_count, 0);
  return [
    { label: '高分样本', value: quality.value.high_score_count, color: '#00b42a' },
    { label: '其他样本', value: other, color: '#c9cdd4' },
  ];
});

const scorePercent = computed(() => {
  if (!quality.value) return 0;
  const score = quality.value.avg_score;
  const normalized = score <= 10 ? score * 10 : score;
  return Math.min(Math.max(normalized, 0), 100);
});

async function loadOverview() {
  const [o, t] = await Promise.all([statisticsOverview(7), statisticsTrend(7)]);
  overview.value = o;
  trend.value = t;
  uni.stopPullDownRefresh();
}

async function loadChannels() {
  channels.value = await statisticsChannels(7);
}

async function loadQuality() {
  const [q, o] = await Promise.all([statisticsQuality(7), overview.value ? Promise.resolve(overview.value) : statisticsOverview(7)]);
  quality.value = q;
  if (!overview.value) overview.value = o;
}

watch(activeTab, async (tab) => {
  if (tab === 'channels' && channels.value.length === 0) await loadChannels();
  if (tab === 'quality' && !quality.value) await loadQuality();
});

onShow(() => {
  initTabBar();
  if (!ensurePermission('statistics:view')) return;
  loadOverview();
});
onPullDownRefresh(async () => {
  if (activeTab.value === 'overview') await loadOverview();
  else if (activeTab.value === 'channels') {
    await loadChannels();
    uni.stopPullDownRefresh();
  } else if (activeTab.value === 'quality') {
    await loadQuality();
    uni.stopPullDownRefresh();
  }
});
</script>

<style scoped lang="scss">
.statistics-scroll {
  height: calc(100vh - 148px);
  padding-bottom: calc(8px + env(safe-area-inset-bottom));
}

.chart-card__head {
  padding: 14px 16px 4px;
}

.chart-card__title {
  display: block;
  font-size: 15px;
  font-weight: 600;
  color: var(--cs-text-primary);
}

.chart-card__desc {
  display: block;
  margin-top: 2px;
  font-size: 12px;
  color: var(--cs-text-muted);
}

.metric-list {
  padding: 4px 16px 16px;
}

.metric-item + .metric-item {
  margin-top: 14px;
}

.metric-item__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.metric-item__label {
  font-size: 13px;
  color: var(--cs-text-secondary);
}

.metric-item__value {
  font-size: 14px;
  font-weight: 600;
  color: var(--cs-text-primary);
  font-variant-numeric: tabular-nums;
}

.metric-item__track {
  height: 8px;
  border-radius: var(--cs-radius-full);
  background: var(--cs-bg-subtle);
  overflow: hidden;
}

.metric-item__fill {
  height: 100%;
  border-radius: var(--cs-radius-full);
  min-width: 2px;
  transition: width 0.3s ease;
}

.metric-item__fill--primary { background: var(--cs-primary); }
.metric-item__fill--success { background: var(--cs-success); }
.metric-item__fill--warning { background: var(--cs-warning); }
</style>
