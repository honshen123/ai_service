<template>
  <view class="bar-chart">
    <view v-if="legend.length > 1" class="bar-chart__legend">
      <view v-for="item in legend" :key="item.name" class="bar-chart__legend-item">
        <view class="bar-chart__legend-dot" :style="{ background: item.color }" />
        <text>{{ item.name }}</text>
      </view>
    </view>
    <view class="bar-chart__canvas">
      <svg
        class="bar-chart__svg"
        :viewBox="`0 0 ${width} ${height}`"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <line
          v-for="(y, idx) in gridYs"
          :key="idx"
          :x1="padding.left"
          :y1="y"
          :x2="width - padding.right"
          :y2="y"
          class="bar-chart__grid"
        />
        <rect
          v-for="bar in bars"
          :key="bar.key"
          :x="bar.x"
          :y="bar.y"
          :width="bar.w"
          :height="bar.h"
          :rx="3"
          :fill="bar.color"
          opacity="0.92"
        />
      </svg>
      <view class="bar-chart__xlabels">
        <text
          v-for="(label, index) in labels"
          :key="label + index"
          class="bar-chart__xlabel"
          :style="{ left: labelPositions[index] + '%' }"
        >
          {{ label }}
        </text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { ChartSeries } from '@/utils/chart';
import { niceMax } from '@/utils/chart';

const props = withDefaults(
  defineProps<{
    labels: string[];
    series: ChartSeries[];
    height?: number;
  }>(),
  { height: 180 },
);

const width = 320;
const height = computed(() => props.height);
const padding = { top: 16, right: 12, bottom: 8, left: 8 };

const maxY = computed(() => {
  const values = props.series.flatMap((item) => item.data);
  return niceMax(Math.max(...values, 0));
});

const gridYs = computed(() => {
  const chartH = height.value - padding.top - padding.bottom;
  return [0, 1, 2, 3].map((i) => padding.top + (chartH / 3) * i);
});

const legend = computed(() => props.series.map(({ name, color }) => ({ name, color })));

const bars = computed(() => {
  const count = props.labels.length;
  if (count === 0) return [];

  const chartW = width - padding.left - padding.right;
  const chartH = height.value - padding.top - padding.bottom;
  const groupW = chartW / count;
  const seriesCount = props.series.length;
  const gap = seriesCount > 1 ? 2 : 0;
  const barW = Math.min(18, (groupW - 8 - gap * (seriesCount - 1)) / seriesCount);
  const result: { key: string; x: number; y: number; w: number; h: number; color: string }[] = [];

  props.labels.forEach((_, index) => {
    const groupStart = padding.left + groupW * index + (groupW - barW * seriesCount - gap * (seriesCount - 1)) / 2;
    props.series.forEach((item, seriesIndex) => {
      const value = item.data[index] || 0;
      const h = (value / maxY.value) * chartH;
      result.push({
        key: `${index}-${item.name}`,
        x: groupStart + seriesIndex * (barW + gap),
        y: padding.top + chartH - h,
        w: barW,
        h: Math.max(h, value > 0 ? 2 : 0),
        color: item.color,
      });
    });
  });

  return result;
});

const labelPositions = computed(() => {
  const count = props.labels.length;
  if (count <= 1) return [50];
  return props.labels.map((_, index) => ((index + 0.5) / count) * 100);
});
</script>

<style scoped lang="scss">
.bar-chart__legend {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  padding: 0 16px 10px;
}

.bar-chart__legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--cs-text-secondary);
}

.bar-chart__legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 2px;
}

.bar-chart__canvas {
  position: relative;
  padding: 0 12px 28px;
}

.bar-chart__svg {
  width: 100%;
  height: 180px;
  display: block;
}

.bar-chart__grid {
  stroke: var(--cs-divider);
  stroke-width: 1;
  stroke-dasharray: 4 4;
}

.bar-chart__xlabels {
  position: relative;
  height: 18px;
  margin-top: 6px;
}

.bar-chart__xlabel {
  position: absolute;
  transform: translateX(-50%);
  font-size: 11px;
  color: var(--cs-text-muted);
  white-space: nowrap;
}
</style>
