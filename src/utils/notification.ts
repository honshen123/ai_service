export function formatNotifyTime(value: string | null | undefined): string {
  if (!value) return '';
  return value.replace('T', ' ').slice(0, 16);
}

export function notificationTypeLabel(type: string): string {
  const map: Record<string, string> = {
    customer_message: '客户消息',
    package_expired: '套餐到期',
    package_expire_soon: '到期提醒',
    token_empty: 'Token',
    token_low: 'Token',
    message_empty: '消息额度',
    message_low: '消息额度',
    seat_full: '席位',
    seat_warn: '席位',
    shop_full: '店铺配额',
    shop_warn: '店铺配额',
    order_pending: '待支付',
    tenant_new: '新租户',
    payment_failed: '支付失败',
    tenant_billing_watch: '计费预警',
  };
  return map[type] || '';
}

export function notificationTypeClass(type: string): string {
  if (type.includes('expired') || type.includes('empty') || type === 'payment_failed') return 'notify-type--danger';
  if (type.includes('low') || type.includes('warn') || type.includes('expire') || type === 'order_pending') {
    return 'notify-type--warning';
  }
  if (type === 'customer_message') return 'notify-type--success';
  return 'notify-type--info';
}
