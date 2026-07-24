<template>

  <view class="page-header">

    <view v-if="showBrand" class="page-header__top">

      <view class="page-header__brand">

        <view class="page-header__mark">AI</view>

        <view class="page-header__main">

          <text class="page-header__title">{{ title }}</text>

          <text v-if="description" class="page-header__desc">{{ description }}</text>

        </view>

      </view>

      <view v-if="$slots.action" class="page-header__action">

        <slot name="action" />

      </view>

    </view>

    <view v-else class="page-header__row">

      <view class="page-header__main">

        <text class="page-header__title">{{ title }}</text>

        <text v-if="description" class="page-header__desc">{{ description }}</text>

      </view>

      <view v-if="$slots.action" class="page-header__action">

        <slot name="action" />

      </view>

    </view>

    <slot />

  </view>

</template>



<script setup lang="ts">

withDefaults(

  defineProps<{

    title: string;

    description?: string;

    showBrand?: boolean;

  }>(),

  { showBrand: true },

);

</script>



<style scoped lang="scss">

.page-header__main {

  flex: 1;

  min-width: 0;

}



.page-header__action {

  flex-shrink: 0;

  margin-left: 12px;

}

</style>


