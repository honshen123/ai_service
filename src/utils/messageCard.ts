export interface ProductCardData {
  product_id: string;
  sku_id?: string;
  title?: string;
  price?: number | null;
  pic_url?: string;
}

export interface OrderCardData {
  order_no: string;
  status?: string;
  amount?: number | null;
  title?: string;
}

export interface MessageExtraJson {
  card_type?: 'product' | 'order';
  product_id?: string;
  sku_id?: string;
  title?: string;
  price?: number | null;
  pic_url?: string;
  order_no?: string;
  status?: string;
  amount?: number | null;
}

interface MessageLike {
  message_type?: number;
  content: string;
  extra_json?: Record<string, unknown> | string;
}

export function parseMessageExtra(raw: unknown): MessageExtraJson {
  if (raw === null || raw === undefined || raw === '') return {};
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw) as unknown;
      return typeof parsed === 'object' && parsed !== null ? (parsed as MessageExtraJson) : {};
    } catch {
      return {};
    }
  }
  if (typeof raw === 'object') return raw as MessageExtraJson;
  return {};
}

export function isProductMessage(item: MessageLike): boolean {
  if (item.message_type === 3) return true;
  return parseMessageExtra(item.extra_json).card_type === 'product';
}

export function isOrderMessage(item: MessageLike): boolean {
  if (item.message_type === 4) return true;
  return parseMessageExtra(item.extra_json).card_type === 'order';
}

export function toProductCard(item: MessageLike): ProductCardData {
  const extra = parseMessageExtra(item.extra_json);
  return {
    product_id: String(extra.product_id || '').trim(),
    sku_id: String(extra.sku_id || '').trim() || undefined,
    title: String(extra.title || '').trim() || undefined,
    price: extra.price ?? null,
    pic_url: String(extra.pic_url || '').trim() || undefined,
  };
}

export function toOrderCard(item: MessageLike): OrderCardData {
  const extra = parseMessageExtra(item.extra_json);
  return {
    order_no: String(extra.order_no || '').trim(),
    status: String(extra.status || '').trim() || undefined,
    amount: extra.amount ?? null,
    title: String(extra.title || '').trim() || undefined,
  };
}

export function formatPrice(price?: number | null): string {
  if (price === null || price === undefined || Number.isNaN(Number(price))) return '';
  return `¥${Number(price).toFixed(2)}`;
}

export function resolveMediaUrl(url?: string): string {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return url.startsWith('/') ? url : `/${url}`;
}

export function isImageMessage(item: MessageLike): boolean {
  return item.message_type === 2;
}

export function sessionProductLabel(productId?: string, skuId?: string): string {
  const pid = String(productId || '').trim();
  const sid = String(skuId || '').trim();
  if (!pid) return '';
  return sid ? `${pid} · SKU ${sid}` : pid;
}
