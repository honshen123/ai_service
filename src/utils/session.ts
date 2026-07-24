/** 值守模式文案 */
export function hostingModeText(mode: number): string {
  return ({ 0: '人工值守', 1: 'AI 审核', 2: 'AI 托管' }[mode] || '未知') as string;
}

/** 值守模式样式类型 */
export function hostingModeType(mode: number): 'manual' | 'review' | 'auto' {
  if (mode === 2) return 'auto';
  if (mode === 1) return 'review';
  return 'manual';
}

/** 消息发送方文案 */
export function senderText(type: number): string {
  return ({ 1: '客户', 2: '客服', 3: 'AI', 4: '系统', 5: '机器人' }[type] || `#${type}`) as string;
}

/** 是否为客户消息（气泡靠左） */
export function isCustomerMessage(senderType: number): boolean {
  return senderType === 1;
}

/** 工单状态文案 */
export function ticketStatusText(status: number): string {
  return ({ 0: '待处理', 1: '处理中', 2: '待确认', 3: '已解决', 4: '已关闭' }[status] || '未知') as string;
}

/** 工单状态标签类型 */
export function ticketStatusType(status: number): 'pending' | 'processing' | 'confirm' | 'resolved' | 'closed' {
  if (status === 3) return 'resolved';
  if (status === 1) return 'processing';
  if (status === 0) return 'pending';
  if (status === 2) return 'confirm';
  return 'closed';
}

/** 工单优先级文案 */
export function ticketPriorityText(priority: number): string {
  return ({ 1: '低', 2: '中', 3: '高', 4: '紧急' }[priority] || '中') as string;
}

/** 计费订单类型 */
export function orderTypeText(type: number): string {
  return ({ 1: '套餐订阅', 2: 'Token 充值', 3: '席位扩容', 4: '店铺扩容', 5: '消息包' }[type] || '订单') as string;
}

/** 平台标识色 */
export function platformLabel(platform: string): string {
  const map: Record<string, string> = {
    taobao: '淘宝',
    pinduoduo: '拼多多',
    pdd: '拼多多',
    douyin: '抖音',
    kuaishou: '快手',
    tiktok: 'TikTok',
    shopee: 'Shopee',
    jd: '京东',
    alibaba1688: '1688',
    '1688': '1688',
  };
  return map[platform.toLowerCase()] || platform || '未知平台';
}

/** 格式化相对时间（简易） */
export function formatRelativeTime(time?: string): string {
  if (!time) return '';
  const date = new Date(time.replace(/-/g, '/'));
  if (Number.isNaN(date.getTime())) return time;
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes} 分钟前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} 小时前`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} 天前`;
  return time.slice(0, 16);
}

/** 格式化数字（千分位） */
export function formatNumber(value: number | null | undefined): string {
  if (value == null || Number.isNaN(Number(value))) return '0';
  return Number(value).toLocaleString('zh-CN');
}
