<template>
  <view class="line-chart">
    <view v-if="legend.length" class="line-chart__legend">
      <view v-for="item in legend" :key="item.name" class="line-chart__legend-item">
        <view class="line-chart__legend-dot" :style="{ background: item.color }" />
        <text>{{ item.name }}</text>
      </view>
    </view>
    <view class="line-chart__canvas">
      <svg
        class="line-chart__svg"
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
          class="line-chart__grid"
        />
        <path
          v-for="area in areas"
          :key="area.name + '-area'"
          :d="area.d"
          :fill="area.color"
          opacity="0.12"
        />
        <path
          v-for="line in lines"
          :key="line.name"
          :d="line.d"
          fill="none"
          :stroke="line.color"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <circle
          v-for="point in dots"
          :key="point.key"
          :cx="point.x"
          :cy="point.y"
          r="3"
          :fill="point.color"
          stroke="#fff"
          stroke-width="1.5"
        />
      </svg>
      <view class="line-chart__xlabels">
        <text
          v-for="(label, index) in labels"
          :key="label + index"
          class="line-chart__xlabel"
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
import { buildAreaPath, buildLinePath, niceMax } from '@/utils/chart';

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

const lines = computed(() =>
  props.series.map((item) => ({
    name: item.name,
    color: item.color,
    d: buildLinePath(item.data, width, height.value, padding, maxY.value),
  })),
);

const areas = computed(() =>
  props.series.map((item) => {
    const lineD = buildLinePath(item.data, width, height.value, padding, maxY.value);
    return {
      name: item.name,
      color: item.color,
      d: buildAreaPath(lineD, item.data.length, width, height.value, padding),
    };
  }),
);

const dots = computed(() => {
  const chartW = width - padding.left - padding.right;
  const chartH = height.value - padding.top - padding.bottom;
  const step = props.labels.length > 1 ? chartW / (props.labels.length - 1) : 0;
  const result: { key: string; x: number; y: number; color: string }[] = [];

  props.series.forEach((item) => {
    item.data.forEach((value, index) => {
      result.push({
        key: `${item.name}-${index}`,
        x: padding.left + step * index,
        y: padding.top + chartH - (value / maxY.value) * chartH,
        color: item.color,
      });
    });
  });

  return result;
});

const labelPositions = computed(() => {
  const count = props.labels.length;
  if (count <= 1) return [50];
  return props.labels.map((_, index) => (index / (count - 1)) * 100);
});
</script>

<style scoped lang="scss">
.line-chart__legend {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  padding: 0 16px 10px;
}

.line-chart__legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--cs-text-secondary);
}

.line-chart__legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.line-chart__canvas {
  position: relative;
  padding: 0 12px 28px;
}

.line-chart__svg {
  width: 100%;
  height: 180px;
  display: block;
}

.line-chart__grid {
  stroke: var(--cs-divider);
  stroke-width: 1;
  stroke-dasharray: 4 4;
}

.line-chart__xlabels {
  position: relative;
  height: 18px;
  margin-top: 6px;
}

.line-chart__xlabel {
  position: absolute;
  transform: translateX(-50%);
  font-size: 11px;
  color: var(--cs-text-muted);
  white-space: nowrap;
}
</style>
