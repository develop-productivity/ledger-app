export type EntryType = 'expense' | 'income';

export interface Entry {
  id: string;
  type: EntryType;
  amountCents: number;
  category: string;
  note: string;
  date: string; // YYYY-MM-DD，本地日期
  createdAt: number;
}

export interface LedgerData {
  version: 1;
  entries: Entry[];
}

export const CATEGORIES: Record<EntryType, string[]> = {
  expense: ['餐饮', '交通', '购物', '居住', '娱乐', '其他'],
  income: ['工资', '副业', '其他'],
};

const MAX_CENTS = 100_000_000_00;

export function parseAmount(text: string): number | null {
  const t = text.trim();
  if (!/^\d+(\.\d{1,2})?$/.test(t)) return null;
  const [yuan, frac = ''] = t.split('.');
  const cents = Number(yuan) * 100 + Number(frac.padEnd(2, '0'));
  if (cents <= 0 || cents > MAX_CENTS) return null;
  return cents;
}

export function formatCents(cents: number): string {
  const sign = cents < 0 ? '-' : '';
  const abs = Math.abs(cents);
  const yuan = Math.floor(abs / 100).toLocaleString('en-US');
  const frac = String(abs % 100).padStart(2, '0');
  return `${sign}${yuan}.${frac}`;
}

const pad = (n: number) => String(n).padStart(2, '0');

export function toDateString(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function toMonthKey(d: Date): string {
  return toDateString(d).slice(0, 7);
}

export function shiftMonth(monthKey: string, delta: number): string {
  const [y, m] = monthKey.split('-').map(Number);
  return toMonthKey(new Date(y, m - 1 + delta, 1));
}

export function entriesOfMonth(entries: Entry[], monthKey: string): Entry[] {
  return entries
    .filter((e) => e.date.startsWith(monthKey))
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt);
}

export function summarize(entries: Entry[]) {
  let income = 0;
  let expense = 0;
  for (const e of entries) {
    if (e.type === 'income') income += e.amountCents;
    else expense += e.amountCents;
  }
  return { income, expense, balance: income - expense };
}

export function groupByDate(entries: Entry[]): { date: string; items: Entry[] }[] {
  const groups: { date: string; items: Entry[] }[] = [];
  for (const e of entries) {
    const last = groups[groups.length - 1];
    if (last && last.date === e.date) last.items.push(e);
    else groups.push({ date: e.date, items: [e] });
  }
  return groups;
}

export function newId(now: number): string {
  return `${now.toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function isEntry(x: unknown): x is Entry {
  if (typeof x !== 'object' || x === null) return false;
  const e = x as Record<string, unknown>;
  return (
    typeof e.id === 'string' &&
    (e.type === 'expense' || e.type === 'income') &&
    Number.isInteger(e.amountCents) &&
    (e.amountCents as number) > 0 &&
    typeof e.category === 'string' &&
    typeof e.note === 'string' &&
    typeof e.date === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(e.date) &&
    typeof e.createdAt === 'number'
  );
}

// 返回 null 表示数据不认识，调用方不能覆盖原数据
export function deserialize(raw: string | null): LedgerData | null {
  if (raw === null) return { version: 1, entries: [] };
  try {
    const data = JSON.parse(raw);
    if (data?.version !== 1 || !Array.isArray(data.entries)) return null;
    if (!data.entries.every(isEntry)) return null;
    return { version: 1, entries: data.entries };
  } catch {
    return null;
  }
}

export function serialize(entries: Entry[]): string {
  const data: LedgerData = { version: 1, entries };
  return JSON.stringify(data);
}
