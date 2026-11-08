import { isEntry, type Entry } from './ledger';

/** 备份文件格式的版本，跟着本机存储格式（ledger.v1）走 */
export const BACKUP_VERSION = 1;

export interface BackupFile {
  app: 'ledger';
  version: number;
  exportedAt: string;
  entries: Entry[];
}

export function toBackupJson(entries: Entry[], now: Date): string {
  const data: BackupFile = { app: 'ledger', version: BACKUP_VERSION, exportedAt: now.toISOString(), entries };
  return JSON.stringify(data, null, 2);
}

export type ParseResult =
  | { ok: true; entries: Entry[] }
  | { ok: false; reason: 'not-json' | 'bad-format' | 'newer-version' };

/** 解析备份文件。整份校验：有一条不合法就整份拒绝，不导入一部分。 */
export function parseBackup(text: string): ParseResult {
  let data: unknown;
  try {
    data = JSON.parse(text.replace(/^﻿/, ''));
  } catch {
    return { ok: false, reason: 'not-json' };
  }
  if (typeof data !== 'object' || data === null) return { ok: false, reason: 'bad-format' };
  const d = data as Record<string, unknown>;
  if (d.app !== undefined && d.app !== 'ledger') return { ok: false, reason: 'bad-format' };
  if (typeof d.version === 'number' && d.version > BACKUP_VERSION) return { ok: false, reason: 'newer-version' };
  if (d.version !== BACKUP_VERSION || !Array.isArray(d.entries) || !d.entries.every(isEntry)) {
    return { ok: false, reason: 'bad-format' };
  }
  if (!d.entries.every((e: Entry) => isRealDate(e.date))) return { ok: false, reason: 'bad-format' };
  // 只取已知字段：手工改过的文件里多出来的字段不存进本机
  return { ok: true, entries: d.entries.map(pickFields) };
}

function isRealDate(date: string): boolean {
  const [y, m, d] = date.split('-').map(Number);
  const t = new Date(Date.UTC(y, m - 1, d));
  return t.getUTCFullYear() === y && t.getUTCMonth() === m - 1 && t.getUTCDate() === d;
}

function pickFields(e: Entry): Entry {
  const { id, type, amountCents, category, note, date, createdAt } = e;
  return { id, type, amountCents, category, note, date, createdAt };
}

function sameEntry(a: Entry, b: Entry): boolean {
  return (
    a.type === b.type &&
    a.amountCents === b.amountCents &&
    a.category === b.category &&
    a.note === b.note &&
    a.date === b.date &&
    a.createdAt === b.createdAt
  );
}

export interface MergeResult {
  entries: Entry[];
  added: number;
  /** 本机已有同一条，内容一样 */
  same: number;
  /** 本机已有同一 id，内容不同，保留本机的 */
  conflicts: number;
}

/** 按 id 合并：只新增，不删除、不覆盖本机记录。 */
export function mergeEntries(current: Entry[], incoming: Entry[]): MergeResult {
  const byId = new Map(current.map((e) => [e.id, e]));
  const added: Entry[] = [];
  let same = 0;
  let conflicts = 0;
  for (const e of incoming) {
    const existing = byId.get(e.id);
    if (!existing) {
      byId.set(e.id, e);
      added.push(e);
    } else if (sameEntry(existing, e)) {
      same++;
    } else {
      conflicts++;
    }
  }
  return { entries: [...current, ...added], added: added.length, same, conflicts };
}

function csvField(value: string): string {
  // 防 CSV 注入：表格软件会把 = + - @ 开头的内容当公式
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return /[",\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

function plainYuan(cents: number): string {
  return `${Math.floor(cents / 100)}.${String(cents % 100).padStart(2, '0')}`;
}

/** 导出给 Excel / WPS 用的 CSV。开头带 BOM，按日期从新到旧。 */
export function toCsv(entries: Entry[]): string {
  const rows = [...entries]
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt)
    .map((e) =>
      [e.date, e.type === 'expense' ? '支出' : '收入', e.category, plainYuan(e.amountCents), e.note]
        .map(csvField)
        .join(','),
    );
  return '﻿' + ['日期,类型,分类,金额,备注', ...rows].join('\r\n') + '\r\n';
}

function stamp(now: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}${p(now.getMonth() + 1)}${p(now.getDate())}-${p(now.getHours())}${p(now.getMinutes())}`;
}

export function backupFileName(now: Date): string {
  return `ledger-backup-${stamp(now)}.json`;
}

export function csvFileName(now: Date): string {
  return `ledger-${stamp(now)}.csv`;
}
