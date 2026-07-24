<template>
  <view class="tab-icon" :class="{ 'tab-icon--active': active }">
    <!-- 工作台 -->
    <view v-if="name === 'workbench'" class="tab-icon__glyph">
      <view class="icon-workbench" />
    </view>
    <!-- 消息 -->
    <view v-else-if="name === 'message'" class="tab-icon__glyph">
      <view class="icon-message" />
    </view>
    <!-- 工单 -->
    <view v-else-if="name === 'ticket'" class="tab-icon__glyph">
      <view class="icon-ticket" />
    </view>
    <!-- 数据 -->
    <view v-else-if="name === 'stats'" class="tab-icon__glyph">
      <view class="icon-stats" />
    </view>
    <!-- 我的 -->
    <view v-else-if="name === 'profile'" class="tab-icon__glyph">
      <view class="icon-profile" />
    </view>
  </view>
</template>

<script setup lang="ts">
defineProps<{
  name: 'workbench' | 'message' | 'ticket' | 'stats' | 'profile';
  active?: boolean;
}>();
</script>

<style scoped lang="scss">
.tab-icon {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--cs-tab-inactive);
}

.tab-icon--active {
  color: var(--cs-tab-active);
}

.tab-icon__glyph {
  width: 22px;
  height: 22px;
  position: relative;
}

.icon-workbench,
.icon-message,
.icon-ticket,
.icon-stats,
.icon-profile {
  width: 100%;
  height: 100%;
  box-sizing: border-box;
}

.icon-workbench {
  border: none;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    width: 7px;
    height: 7px;
    left: 2px;
    top: 2px;
    background: currentColor;
    border-radius: 2px;
    box-shadow: 9px 0 0 currentColor, 0 9px 0 currentColor, 9px 9px 0 currentColor;
  }
}

.icon-message {
  border: 2px solid currentColor;
  border-radius: 10px 10px 10px 4px;
  position: relative;

  &::after {
    content: '';
    position: absolute;
    left: 4px;
    top: 7px;
    width: 10px;
    height: 2px;
    background: currentColor;
    box-shadow: 0 4px 0 currentColor;
  }
}

.icon-ticket {
  border: 2px solid currentColor;
  border-radius: 4px;
  border-style: dashed;
  position: relative;

  &::before,
  &::after {
    content: '';
    position: absolute;
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: var(--cs-tab-bg, #fff);
    border: 2px solid currentColor;
    top: 50%;
    transform: translateY(-50%);
  }

  &::before { left: -3px; }
  &::after { right: -3px; }
}

.icon-stats {
  border: none;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 3px;
  padding: 0 1px;

  background: linear-gradient(to top, currentColor 0 0) 0 100% / 4px 8px no-repeat,
    linear-gradient(to top, currentColor 0 0) 7px 100% / 4px 14px no-repeat,
    linear-gradient(to top, currentColor 0 0) 14px 100% / 4px 10px no-repeat;
}

.icon-profile {
  border: 2px solid currentColor;
  border-radius: 50%;
  position: relative;

  &::after {
    content: '';
    position: absolute;
    left: 50%;
    bottom: 3px;
    transform: translateX(-50%);
    width: 8px;
    height: 4px;
    border: 2px solid currentColor;
    border-top: none;
    border-radius: 0 0 6px 6px;
  }
}
</style>
