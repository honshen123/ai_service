import { defineStore } from 'pinia';
import type { UserInfo } from '@/types/api';
import { clearStorage, getStorage, setStorage } from '@/utils/storage';

const ACCESS_KEY = 'aics.mobile.access';
const REFRESH_KEY = 'aics.mobile.refresh';
const TENANT_KEY = 'aics.mobile.tenant';
const USER_KEY = 'aics.mobile.user';
const CSRF_KEY = 'aics.mobile.csrf';

function readUser(): UserInfo | null {
  const raw = getStorage(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as UserInfo;
  } catch {
    return null;
  }
}

export function getAccessToken(): string {
  return getStorage(ACCESS_KEY);
}

export function getRefreshToken(): string {
  return getStorage(REFRESH_KEY);
}

export function setAccessToken(token: string): void {
  setStorage(ACCESS_KEY, token);
}

export function setRefreshToken(token: string): void {
  setStorage(REFRESH_KEY, token);
}

export function getCsrfToken(): string {
  return getStorage(CSRF_KEY);
}

export function setCsrfToken(token: string): void {
  setStorage(CSRF_KEY, token);
}

export function getTenantCode(): string {
  return getStorage(TENANT_KEY);
}

export function clearAuthStorage(): void {
  clearStorage([ACCESS_KEY, REFRESH_KEY, TENANT_KEY, USER_KEY, CSRF_KEY]);
}

export const useAuthStore = defineStore('mobile-auth', {
  state: () => ({
    accessToken: getAccessToken(),
    refreshToken: getStorage(REFRESH_KEY),
    tenantCode: getTenantCode(),
    user: readUser(),
  }),
  getters: {
    isAuthed: (state) => Boolean(state.accessToken),
  },
  actions: {
    setAuth(payload: { accessToken: string; refreshToken: string; tenantCode: string; user: UserInfo }) {
      this.accessToken = payload.accessToken;
      this.refreshToken = payload.refreshToken;
      this.tenantCode = payload.tenantCode;
      this.user = payload.user;
      setStorage(ACCESS_KEY, payload.accessToken);
      setStorage(REFRESH_KEY, payload.refreshToken);
      setStorage(TENANT_KEY, payload.tenantCode);
      setStorage(USER_KEY, JSON.stringify(payload.user));
    },
    clearAuth() {
      this.accessToken = '';
      this.refreshToken = '';
      this.tenantCode = '';
      this.user = null;
      clearAuthStorage();
    },
    updateUser(user: Partial<UserInfo>) {
      if (!this.user) return;
      this.user = { ...this.user, ...user };
      setStorage(USER_KEY, JSON.stringify(this.user));
    },
  },
});
