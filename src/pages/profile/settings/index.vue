<template>
  <view class="page page-with-nav settings-page" :class="themeClass">
    <scroll-view scroll-y class="settings-scroll">
      <view class="settings-wrap">
        <view class="card-block settings-section">
          <view class="settings-section__head">
            <text class="settings-section__title">基本资料</text>
            <text class="settings-section__desc">更新昵称与联系方式</text>
          </view>
          <view class="settings-section__body">
            <view class="info-row">
              <text class="info-row__label">用户名</text>
              <text class="info-row__value">{{ profile.username || '-' }}</text>
            </view>
            <view class="info-row">
              <text class="info-row__label">用户 ID</text>
              <text class="info-row__value">{{ profile.id || '-' }}</text>
            </view>

            <view class="form-field">
              <text class="form-field__label">昵称</text>
              <input
                v-model="profile.nickname"
                class="form-field__input"
                maxlength="64"
                placeholder="请输入昵称"
              />
            </view>
            <view class="form-field">
              <text class="form-field__label">邮箱</text>
              <input
                v-model="profile.email"
                class="form-field__input"
                maxlength="128"
                placeholder="name@example.com"
              />
            </view>
            <view class="form-field form-field--last">
              <text class="form-field__label">手机</text>
              <input
                v-model="profile.phone"
                class="form-field__input"
                maxlength="32"
                placeholder="手机号"
              />
            </view>

            <view class="settings-action">
              <button class="settings-btn btn-primary" :loading="savingProfile" @tap="saveProfile">保存资料</button>
            </view>
          </view>
        </view>

        <view class="card-block settings-section">
          <view class="settings-section__head">
            <text class="settings-section__title">修改密码</text>
            <text class="settings-section__desc">定期更换密码以保障账号安全</text>
          </view>
          <view class="settings-section__body">
            <view class="form-field">
              <text class="form-field__label">当前密码</text>
              <input
                v-model="passwordForm.old_password"
                class="form-field__input"
                password
                placeholder="请输入当前密码"
              />
            </view>
            <view class="form-field">
              <text class="form-field__label">新密码</text>
              <input
                v-model="passwordForm.password"
                class="form-field__input"
                password
                placeholder="至少 6 位"
              />
            </view>
            <view class="form-field form-field--last">
              <text class="form-field__label">确认密码</text>
              <input
                v-model="passwordForm.confirm_password"
                class="form-field__input"
                password
                placeholder="再次输入新密码"
              />
            </view>

            <view class="settings-action">
              <button class="settings-btn btn-primary" :loading="savingPassword" @tap="savePassword">更新密码</button>
            </view>
          </view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { me, updateProfile } from '@/api/tenant';
import { getAccessToken, useAuthStore } from '@/store/auth';
import { toast, toastSuccess, useThemeClass } from '@/composables/useApp';

const authStore = useAuthStore();
const themeClass = useThemeClass();
const savingProfile = ref(false);
const savingPassword = ref(false);

const profile = reactive({
  id: 0,
  username: '',
  nickname: '',
  email: '',
  phone: '',
});

const passwordForm = reactive({
  old_password: '',
  password: '',
  confirm_password: '',
});

async function loadProfile() {
  const user = await me();
  profile.id = user.id;
  profile.username = user.username;
  profile.nickname = user.nickname || '';
  profile.email = user.email || '';
  profile.phone = user.phone || '';
  authStore.updateUser(user);
}

async function saveProfile() {
  const nickname = profile.nickname.trim();
  if (!nickname) {
    toast('请输入昵称');
    return;
  }

  savingProfile.value = true;
  try {
    const user = await updateProfile({
      nickname,
      email: profile.email.trim(),
      phone: profile.phone.trim(),
    });
    authStore.updateUser(user);
    profile.nickname = user.nickname || nickname;
    toastSuccess('资料已保存');
  } catch {
    // request 层已 toast
  } finally {
    savingProfile.value = false;
  }
}

async function savePassword() {
  if (!passwordForm.old_password) {
    toast('请输入当前密码');
    return;
  }
  if (!passwordForm.password || passwordForm.password.length < 6) {
    toast('新密码至少 6 位');
    return;
  }
  if (passwordForm.password !== passwordForm.confirm_password) {
    toast('两次输入的密码不一致');
    return;
  }

  savingPassword.value = true;
  try {
    await updateProfile({
      old_password: passwordForm.old_password,
      password: passwordForm.password,
    });
    passwordForm.old_password = '';
    passwordForm.password = '';
    passwordForm.confirm_password = '';
    toastSuccess('密码已更新');
  } catch {
    // request 层已 toast
  } finally {
    savingPassword.value = false;
  }
}

onShow(async () => {
  if (!getAccessToken()) {
    uni.reLaunch({ url: '/pages/login/index' });
    return;
  }
  try {
    await loadProfile();
  } catch {
    toast('加载资料失败');
  }
});
</script>

<style scoped lang="scss">
.settings-page {
  min-height: 100vh;
  background: var(--cs-bg-page);
}

.settings-scroll {
  height: calc(100vh - 44px);
  box-sizing: border-box;
}

.settings-wrap {
  padding: 12px 0 calc(24px + env(safe-area-inset-bottom));
}

.settings-section__head {
  padding: 16px 16px 12px;
  border-bottom: 1px solid var(--cs-divider);
}

.settings-section__title {
  display: block;
  font-size: 16px;
  font-weight: 600;
  color: var(--cs-text-primary);
  line-height: 1.35;
}

.settings-section__desc {
  display: block;
  margin-top: 4px;
  font-size: 13px;
  color: var(--cs-text-muted);
  line-height: 1.4;
}

.settings-section__body {
  padding: 16px;
}

.info-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 44px;
  padding: 10px 12px;
  margin-bottom: 12px;
  background: var(--cs-bg-subtle);
  border: 1px solid var(--cs-divider);
  border-radius: var(--cs-radius-md);
}

.info-row__label {
  flex-shrink: 0;
  font-size: 13px;
  color: var(--cs-text-secondary);
}

.info-row__value {
  flex: 1;
  min-width: 0;
  text-align: right;
  font-size: 14px;
  color: var(--cs-text-primary);
  font-variant-numeric: tabular-nums;
  word-break: break-all;
}

.form-field {
  margin-bottom: 14px;
}

.form-field--last {
  margin-bottom: 0;
}

.settings-action {
  margin-top: 20px;
  padding-top: 4px;
}

.settings-btn {
  width: 100%;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  font-weight: 500;
  border-radius: var(--cs-radius-md);
}
</style>
