<template>

  <view class="login-page">

    <view class="login-top">

      <view class="brand-mark"><text>AI</text></view>

      <text class="brand-title">智能客服工作台</text>

      <text class="brand-desc">企业级全渠道 AI 客服 · 人机协同</text>

    </view>



    <view class="login-card">

      <text class="login-card__heading">登录</text>



      <view class="field">

        <text class="field__label">租户编码</text>

        <input

          class="field__control"

          type="text"

          :value="form.tenantCode"

          placeholder="如 demo"

          placeholder-class="field__placeholder"

          confirm-type="next"

          @input="onFieldInput('tenantCode', $event)"

        />

      </view>



      <view class="field">

        <text class="field__label">用户名</text>

        <input

          class="field__control"

          type="text"

          :value="form.username"

          placeholder="客服账号"

          placeholder-class="field__placeholder"

          confirm-type="next"

          @input="onFieldInput('username', $event)"

        />

      </view>



      <view class="field">

        <text class="field__label">密码</text>

        <input

          class="field__control"

          type="text"

          :password="true"

          :value="form.password"

          placeholder="请输入密码"

          placeholder-class="field__placeholder"

          confirm-type="done"

          @input="onFieldInput('password', $event)"

          @confirm="onSubmit"

        />

      </view>



      <button class="submit-btn" :loading="loading" :disabled="loading" @tap="onSubmit">

        进入工作台

      </button>



      <view class="demo-hint">

        <text>演示账号 demo · demo_agent · Demo@123456</text>

      </view>

    </view>



    <text class="login-footer">Powered by AI Customer Service</text>

  </view>

</template>



<script setup lang="ts">

import { reactive, ref } from 'vue';

import { onShow } from '@dcloudio/uni-app';

import { login } from '@/api/tenant';

import { getAccessToken, useAuthStore } from '@/store/auth';

import { setStorage } from '@/utils/storage';

import { toastSuccess } from '@/composables/useApp';

import { getDefaultTabPath } from '@/store/tab';



type FormField = 'tenantCode' | 'username' | 'password';



const authStore = useAuthStore();

const loading = ref(false);

const form = reactive({ tenantCode: 'demo', username: 'demo_agent', password: '' });



function readInputValue(event: Event): string {

  const detail = (event as { detail?: { value?: string } }).detail?.value;

  if (typeof detail === 'string') return detail;

  const target = event.target as HTMLInputElement | null;

  return target?.value ?? '';

}



function onFieldInput(field: FormField, event: Event) {

  form[field] = readInputValue(event);

}



async function onSubmit() {

  if (!form.tenantCode.trim() || !form.username.trim() || !form.password) return;

  loading.value = true;

  try {

    setStorage('aics.mobile.tenant', form.tenantCode.trim());

    const result = await login({ username: form.username.trim(), password: form.password });

    authStore.setAuth({

      accessToken: result.access_token,

      refreshToken: result.refresh_token,

      tenantCode: form.tenantCode.trim(),

      user: result.user,

    });

    toastSuccess('登录成功');

    uni.switchTab({ url: getDefaultTabPath(result.user.permissions) });

  } finally {

    loading.value = false;

  }

}



onShow(() => {

  if (getAccessToken()) {

    const authStore = useAuthStore();

    uni.switchTab({ url: getDefaultTabPath(authStore.user?.permissions) });

  }

});

</script>



<style scoped lang="scss">

.login-page {

  min-height: 100vh;

  display: flex;

  flex-direction: column;

  align-items: center;

  justify-content: center;

  padding: calc(var(--status-bar-height, 0px) + 32px) 24px 24px;

  background: #f2f3f5;

}



.login-top {

  text-align: center;

  margin-bottom: 28px;

}



.brand-mark {

  width: 48px;

  height: 48px;

  margin: 0 auto 16px;

  border-radius: 12px;

  background: #3370ff;

  color: #fff;

  display: flex;

  align-items: center;

  justify-content: center;

  font-size: 16px;

  font-weight: 700;

  letter-spacing: 0.04em;

}



.brand-title {

  display: block;

  font-size: 22px;

  font-weight: 600;

  color: #1f2329;

  letter-spacing: -0.01em;

}



.brand-desc {

  display: block;

  margin-top: 6px;

  font-size: 13px;

  color: #8f959e;

}



.login-card {

  width: 100%;

  max-width: 400px;

  background: #fff;

  border-radius: 12px;

  padding: 24px 20px;

  border: 1px solid #e5e6eb;

}



.login-card__heading {

  display: block;

  font-size: 16px;

  font-weight: 600;

  color: #1f2329;

  margin-bottom: 20px;

}



.field {

  margin-bottom: 16px;

}



.field__label {

  display: block;

  font-size: 13px;

  font-weight: 500;

  color: #646a73;

  margin-bottom: 6px;

}



.field__control {

  display: block;

  width: 100%;

  height: 44px;

  line-height: 44px;

  padding: 0 12px;

  font-size: 15px;

  color: #1f2329;

  background: #f7f8fa;

  border: 1px solid #dee0e3;

  border-radius: 8px;

  box-sizing: border-box;

  -webkit-appearance: none;

  appearance: none;

  outline: none;

}



.field__placeholder {

  color: #8f959e;

}



.submit-btn {

  width: 100%;

  height: 44px;

  line-height: 44px;

  margin-top: 4px;

  padding: 0;

  font-size: 15px;

  font-weight: 500;

  color: #fff;

  background: #3370ff;

  border: none;

  border-radius: 8px;



  &::after {

    border: none;

  }



  &[disabled] {

    opacity: 0.6;

  }

}



.demo-hint {

  margin-top: 16px;

  padding-top: 14px;

  border-top: 1px solid #e5e6eb;

  text-align: center;

  font-size: 12px;

  color: #8f959e;

  line-height: 1.5;

}



.login-footer {

  margin-top: 24px;

  font-size: 11px;

  color: #bbbfc4;

  letter-spacing: 0.02em;

}

</style>


