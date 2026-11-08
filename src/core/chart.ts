import { daysInMonth, type Entry, type EntryType } from '@/core/ledger';

export interface Slice {
  category: string;
  cents: number;
  ratio: number;
}

export function breakdown(entries: Entry[], type: EntryType): Slice[] {
  const totals = new Map<string, number>();
  let sum = 0;
  for (const e of entries) {
    if (e.type !== type) continue;
    totals.set(e.category, (totals.get(e.category) ?? 0) + e.amountCents);
    sum += e.amountCents;
  }
  return [...totals]
    .map(([category, cents]) => ({ category, cents, ratio: sum === 0 ? 0 : cents / sum }))
    .sort((a, b) => b.cents - a.cents || a.category.localeCompare(b.category));
}

export interface DonutSegment {
  dashArray: string;
  dashOffset: number;
}

// 每段是一个描边圆：dashArray 画出本段长度，dashOffset 把起点移到前面各段之后
export function donutSegments(ratios: number[], radius: number, gap = 0): DonutSegment[] {
  const circumference = 2 * Math.PI * radius;
  const visibleGap = ratios.length > 1 ? gap : 0;
  let start = 0;
  return ratios.map((r) => {
    const full = r * circumference;
    const len = Math.max(full - visibleGap, 0);
    const seg = { dashArray: `${len} ${circumference - len}`, dashOffset: -start };
    start += full;
    return seg;
  });
}

export function dailyTotals(entries: Entry[], monthKey: string, type: EntryType): number[] {
  const days = new Array<number>(daysInMonth(monthKey)).fill(0);
  for (const e of entries) {
    if (e.type !== type || !e.date.startsWith(monthKey)) continue;
    days[Number(e.date.slice(8, 10)) - 1] += e.amountCents;
  }
  return days;
}
