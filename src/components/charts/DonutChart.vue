<template>
  <view class="donut-chart">
    <view class="donut-chart__body">
      <svg class="donut-chart__svg" viewBox="0 0 160 160" aria-hidden="true">
        <circle cx="80" cy="80" r="58" class="donut-chart__track" />
        <path
          v-for="segment in segmentsView"
          :key="segment.label"
          :d="segment.d"
          :fill="segment.color"
        />
        <text x="80" y="76" text-anchor="middle" class="donut-chart__total">{{ totalLabel }}</text>
        <text x="80" y="94" text-anchor="middle" class="donut-chart__sub">{{ subLabel }}</text>
      </svg>
      <view class="donut-chart__legend">
        <view v-for="item in segmentsView" :key="item.label" class="donut-chart__legend-item">
          <view class="donut-chart__legend-dot" :style="{ background: item.color }" />
          <view class="donut-chart__legend-text">
            <text class="donut-chart__legend-label">{{ item.label }}</text>
            <text class="donut-chart__legend-value">{{ item.value }} · {{ item.percent }}%</text>
          </view>
        </view>
      </view>
    </view>
    <view v-if="segmentsView.length === 0" class="donut-chart__empty">暂无数据</view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { DonutSegment } from '@/utils/chart';
import { describeDonutSegment } from '@/utils/chart';

const props = withDefaults(
  defineProps<{
    segments: DonutSegment[];
    totalLabel?: string;
    subLabel?: string;
  }>(),
  {
    totalLabel: '总计',
    subLabel: '近 7 日',
  },
);

const total = computed(() => props.segments.reduce((sum, item) => sum + item.value, 0));

const segmentsView = computed(() => {
  const sum = total.value;
  if (sum <= 0) return [];

  let angle = 0;
  const cx = 80;
  const cy = 80;
  const outerR = 58;
  const innerR = 38;

  return props.segments
    .filter((item) => item.value > 0)
    .map((item) => {
      const sweep = (item.value / sum) * 360;
      const start = angle;
      const end = angle + sweep;
      angle = end;
      return {
        label: item.label,
        value: item.value,
        color: item.color,
        percent: Math.round((item.value / sum) * 100),
        d: describeDonutSegment(cx, cy, outerR, innerR, start, end - 0.2),
      };
    });
});
</script>

<style scoped lang="scss">
.donut-chart__body {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 16px 16px;
}

.donut-chart__svg {
  width: 132px;
  height: 132px;
  flex-shrink: 0;
}

.donut-chart__track {
  fill: none;
  stroke: var(--cs-divider);
  stroke-width: 20;
}

.donut-chart__total {
  fill: var(--cs-text-primary);
  font-size: 18px;
  font-weight: 600;
}

.donut-chart__sub {
  fill: var(--cs-text-muted);
  font-size: 11px;
}

.donut-chart__legend {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.donut-chart__legend-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.donut-chart__legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-top: 5px;
  flex-shrink: 0;
}

.donut-chart__legend-text {
  min-width: 0;
}

.donut-chart__legend-label {
  display: block;
  font-size: 13px;
  color: var(--cs-text-primary);
  line-height: 1.35;
}

.donut-chart__legend-value {
  display: block;
  margin-top: 2px;
  font-size: 12px;
  color: var(--cs-text-muted);
}

.donut-chart__empty {
  padding: 24px 16px;
  text-align: center;
  font-size: 13px;
  color: var(--cs-text-muted);
}
</style>
