export function getStorage(key: string): string {
  try {
    const value = uni.getStorageSync(key);
    return value ? String(value) : '';
  } catch {
    return '';
  }
}

export function setStorage(key: string, value: string): void {
  uni.setStorageSync(key, value);
}

export function removeStorage(key: string): void {
  uni.removeStorageSync(key);
}

export function clearStorage(keys: string[]): void {
  keys.forEach((key) => removeStorage(key));
}
