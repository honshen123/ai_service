import type { ApiResponse } from '@/types/api';
import {
  clearAuthStorage,
  getAccessToken,
  getCsrfToken,
  getRefreshToken,
  getTenantCode,
  setAccessToken,
  setCsrfToken,
  setRefreshToken,
} from '@/store/auth';

const BASE_URL = import.meta.env.VITE_API_PREFIX || '';

type RequestMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

interface RequestOptions {
  url: string;
  method?: RequestMethod;
  data?: unknown;
  params?: Record<string, string | number | undefined>;
  _retry?: boolean;
  silentError?: boolean;
}

let refreshPromise: Promise<string | null> | null = null;

function buildUrl(url: string, params?: Record<string, string | number | undefined>): string {
  const full = `${BASE_URL}${url}`;
  if (!params) return full;
  const query = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join('&');
  return query ? `${full}?${query}` : full;
}

function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    return Promise.resolve(null);
  }

  if (!refreshPromise) {
    refreshPromise = new Promise((resolve) => {
      const tenantCode = getTenantCode();
      const header: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (tenantCode) header['X-Tenant-Code'] = tenantCode;

      uni.request({
        url: `${BASE_URL}/tenant/auth/refresh`,
        method: 'POST',
        data: { refresh_token: refreshToken },
        header,
        timeout: 15000,
        success: (res) => {
          if (res.statusCode !== 200) {
            resolve(null);
            return;
          }
          const payload = res.data as ApiResponse<{ access_token: string; refresh_token: string }>;
          if (payload?.code !== 0 || !payload.data?.access_token) {
            resolve(null);
            return;
          }
          setAccessToken(payload.data.access_token);
          if (payload.data.refresh_token) {
            setRefreshToken(payload.data.refresh_token);
          }
          resolve(payload.data.access_token);
        },
        fail: () => resolve(null),
        complete: () => {
          refreshPromise = null;
        },
      });
    });
  }

  return refreshPromise;
}

function ensureCsrfToken(): Promise<string | null> {
  const existing = getCsrfToken();
  if (existing) {
    return Promise.resolve(existing);
  }

  const token = getAccessToken();
  if (!token) {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    const tenantCode = getTenantCode();
    const header: Record<string, string> = {
      Authorization: `Bearer ${token}`,
    };
    if (tenantCode) header['X-Tenant-Code'] = tenantCode;

    uni.request({
      url: `${BASE_URL}/tenant/auth/csrf-token`,
      method: 'GET',
      header,
      timeout: 15000,
      success: (res) => {
        const payload = res.data as ApiResponse<{ csrf_token: string }>;
        const csrf = payload?.data?.csrf_token;
        if (csrf) {
          setCsrfToken(csrf);
          resolve(csrf);
        } else {
          resolve(null);
        }
      },
      fail: () => resolve(null),
    });
  });
}

function handleUnauthorized(silent?: boolean): void {
  clearAuthStorage();
  if (!silent) {
    uni.showToast({ title: '登录已失效', icon: 'none' });
    uni.reLaunch({ url: '/pages/login/index' });
  }
}

async function doRequest<T>(options: RequestOptions): Promise<{ data: ApiResponse<T> }> {
  const method = options.method || 'GET';
  const token = getAccessToken();
  const tenantCode = getTenantCode();
  const header: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) header.Authorization = `Bearer ${token}`;
  if (tenantCode) header['X-Tenant-Code'] = tenantCode;

  if (['POST', 'PUT', 'DELETE'].includes(method)) {
    const csrf = await ensureCsrfToken();
    if (csrf) header['X-CSRF-Token'] = csrf;
  }

  return new Promise((resolve, reject) => {
    uni.request({
      url: buildUrl(options.url, options.params),
      method,
      data: options.data as string | Record<string, unknown> | undefined,
      header,
      timeout: 15000,
      success: async (res) => {
        if (res.statusCode === 401) {
          if (!options._retry) {
            const newToken = await refreshAccessToken();
            if (newToken) {
              try {
                const retried = await doRequest<T>({ ...options, _retry: true });
                resolve(retried);
              } catch (err) {
                reject(err);
              }
              return;
            }
          }
          handleUnauthorized(options.silentError);
          reject(new Error('Unauthorized'));
          return;
        }

        const payload = res.data as ApiResponse<T>;
        if (!payload || typeof payload.code !== 'number') {
          if (!options.silentError) {
            uni.showToast({ title: '响应格式错误', icon: 'none' });
          }
          reject(new Error('Invalid response'));
          return;
        }
        if (payload.code !== 0) {
          if (!options.silentError) {
            uni.showToast({ title: payload.message || '请求失败', icon: 'none' });
          }
          reject(new Error(payload.message || 'Request failed'));
          return;
        }
        resolve({ data: payload });
      },
      fail: (err) => {
        if (!options.silentError) {
          uni.showToast({ title: err.errMsg || '网络错误', icon: 'none' });
        }
        reject(err);
      },
    });
  });
}

const http = {
  get<T>(url: string, config?: { params?: Record<string, string | number | undefined>; silentError?: boolean }) {
    return doRequest<T>({ url, method: 'GET', params: config?.params, silentError: config?.silentError });
  },
  post<T>(url: string, data?: unknown, config?: { silentError?: boolean }) {
    return doRequest<T>({ url, method: 'POST', data, silentError: config?.silentError });
  },
  put<T>(url: string, data?: unknown, config?: { silentError?: boolean }) {
    return doRequest<T>({ url, method: 'PUT', data, silentError: config?.silentError });
  },
  delete<T>(url: string, config?: { silentError?: boolean }) {
    return doRequest<T>({ url, method: 'DELETE', silentError: config?.silentError });
  },
};

export default http;
