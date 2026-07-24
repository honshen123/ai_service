export interface ChartSeries {
  name: string;
  color: string;
  data: number[];
}

export interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

export function formatChartDate(date: string): string {
  if (!date) return '';
  const parts = date.split('-');
  if (parts.length >= 3) return `${parts[1]}/${parts[2]}`;
  return date.length >= 5 ? date.slice(5) : date;
}

export function niceMax(value: number): number {
  if (value <= 0) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const normalized = value / magnitude;
  let nice = 10;
  if (normalized <= 1) nice = 1;
  else if (normalized <= 2) nice = 2;
  else if (normalized <= 5) nice = 5;
  return nice * magnitude;
}

export function polarToCartesian(cx: number, cy: number, radius: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(rad),
    y: cy + radius * Math.sin(rad),
  };
}

export function describeDonutSegment(
  cx: number,
  cy: number,
  outerR: number,
  innerR: number,
  startAngle: number,
  endAngle: number,
): string {
  const startOuter = polarToCartesian(cx, cy, outerR, endAngle);
  const endOuter = polarToCartesian(cx, cy, outerR, startAngle);
  const startInner = polarToCartesian(cx, cy, innerR, startAngle);
  const endInner = polarToCartesian(cx, cy, innerR, endAngle);
  const largeArc = endAngle - startAngle <= 180 ? 0 : 1;

  return [
    `M ${startOuter.x} ${startOuter.y}`,
    `A ${outerR} ${outerR} 0 ${largeArc} 0 ${endOuter.x} ${endOuter.y}`,
    `L ${startInner.x} ${startInner.y}`,
    `A ${innerR} ${innerR} 0 ${largeArc} 1 ${endInner.x} ${endInner.y}`,
    'Z',
  ].join(' ');
}

export function buildLinePath(
  data: number[],
  width: number,
  height: number,
  padding: { top: number; right: number; bottom: number; left: number },
  maxY: number,
): string {
  if (data.length === 0) return '';
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;
  const step = data.length > 1 ? chartW / (data.length - 1) : 0;

  return data
    .map((value, index) => {
      const x = padding.left + step * index;
      const y = padding.top + chartH - (value / maxY) * chartH;
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');
}

export function buildAreaPath(
  linePath: string,
  dataLength: number,
  width: number,
  height: number,
  padding: { top: number; right: number; bottom: number; left: number },
): string {
  if (dataLength === 0) return '';
  const chartW = width - padding.left - padding.right;
  const baseY = height - padding.bottom;
  const step = dataLength > 1 ? chartW / (dataLength - 1) : 0;
  const endX = padding.left + step * (dataLength - 1);
  return `${linePath} L ${endX} ${baseY} L ${padding.left} ${baseY} Z`;
}
