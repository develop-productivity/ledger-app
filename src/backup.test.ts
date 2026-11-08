import { backupFileName, csvFileName, mergeEntries, parseBackup, toBackupJson, toCsv } from './backup';
import { serialize, type Entry } from './ledger';

const e = (id: string, over: Partial<Entry> = {}): Entry => ({
  id,
  type: 'expense',
  amountCents: 1250,
  category: '餐饮',
  note: '',
  date: '2026-11-08',
  createdAt: 1,
  ...over,
});

const now = new Date(2026, 10, 8, 9, 5);

describe('备份往返', () => {
  test('导出再解析，记录完全一样', () => {
    const entries = [e('a'), e('b', { type: 'income', category: '工资', note: '十一月' })];
    expect(parseBackup(toBackupJson(entries, now))).toEqual({ ok: true, entries });
  });

  test('备份文件带 app、version、exportedAt', () => {
    const data = JSON.parse(toBackupJson([], now));
    expect(data.app).toBe('ledger');
    expect(data.version).toBe(1);
    expect(data.exportedAt).toBe(now.toISOString());
  });

  test('也接受本机存储原样的格式（没有 app 字段）', () => {
    expect(parseBackup(serialize([e('a')]))).toEqual({ ok: true, entries: [e('a')] });
  });

  test('开头有 BOM 也能读', () => {
    expect(parseBackup('﻿' + toBackupJson([e('a')], now)).ok).toBe(true);
  });
});

describe('坏文件整份拒绝', () => {
  test.each([
    ['不是 JSON', 'hello', 'not-json'],
    ['空文件', '', 'not-json'],
    ['JSON 但不是对象', '[1,2]', 'bad-format'],
    ['null', 'null', 'bad-format'],
    ['别的 App 的文件', JSON.stringify({ app: 'other', version: 1, entries: [] }), 'bad-format'],
    ['没有 entries', JSON.stringify({ version: 1 }), 'bad-format'],
    ['没有 version', JSON.stringify({ entries: [] }), 'bad-format'],
    ['更新版本的备份', JSON.stringify({ app: 'ledger', version: 2, entries: [] }), 'newer-version'],
  ])('%s', (_name, text, reason) => {
    expect(parseBackup(text)).toEqual({ ok: false, reason });
  });

  test('有一条金额不合法，整份拒绝', () => {
    const text = JSON.stringify({ app: 'ledger', version: 1, entries: [e('a'), e('b', { amountCents: 12.5 })] });
    expect(parseBackup(text)).toEqual({ ok: false, reason: 'bad-format' });
  });

  test.each(['2026-99-99', '2026-02-30', '2026-13-01', '2026-00-10'])('日期 %s 不存在，整份拒绝', (date) => {
    const text = JSON.stringify({ version: 1, entries: [e('a'), e('b', { date })] });
    expect(parseBackup(text)).toEqual({ ok: false, reason: 'bad-format' });
  });

  test('闰年 2 月 29 日可以导入', () => {
    expect(parseBackup(JSON.stringify({ version: 1, entries: [e('a', { date: '2028-02-29' })] })).ok).toBe(true);
  });

  test('多出来的字段不导入', () => {
    const text = JSON.stringify({ version: 1, entries: [{ ...e('a'), evil: '<script>', extra: 1 }] });
    expect(parseBackup(text)).toEqual({ ok: true, entries: [e('a')] });
  });

  test('有一条日期格式不对，整份拒绝', () => {
    const text = JSON.stringify({ version: 1, entries: [e('a', { date: '2026/11/08' })] });
    expect(parseBackup(text)).toEqual({ ok: false, reason: 'bad-format' });
  });
});

describe('mergeEntries', () => {
  test('本机为空：全部新增', () => {
    const r = mergeEntries([], [e('a'), e('b')]);
    expect(r).toMatchObject({ added: 2, same: 0, conflicts: 0 });
    expect(r.entries.map((x) => x.id)).toEqual(['a', 'b']);
  });

  test('同一条内容一样：跳过，不重复', () => {
    const r = mergeEntries([e('a')], [e('a'), e('b')]);
    expect(r).toMatchObject({ added: 1, same: 1, conflicts: 0 });
    expect(r.entries).toHaveLength(2);
  });

  test('同一 id 内容不同：保留本机', () => {
    const local = e('a', { amountCents: 999 });
    const r = mergeEntries([local], [e('a')]);
    expect(r).toMatchObject({ added: 0, same: 0, conflicts: 1 });
    expect(r.entries).toEqual([local]);
  });

  test('不删除本机独有的记录', () => {
    const r = mergeEntries([e('x')], [e('a')]);
    expect(r.entries.map((x) => x.id)).toEqual(['x', 'a']);
  });

  test('备份里同一 id 出现两次，只加一次', () => {
    const r = mergeEntries([], [e('a'), e('a', { amountCents: 1 })]);
    expect(r).toMatchObject({ added: 1, conflicts: 1 });
    expect(r.entries).toEqual([e('a')]);
  });

  test('同一份备份恢复两次，第二次什么都不加', () => {
    const backup = [e('a'), e('b')];
    const once = mergeEntries([], backup).entries;
    expect(mergeEntries(once, backup)).toMatchObject({ added: 0, same: 2 });
  });
});

describe('toCsv', () => {
  test('表头、BOM、按日期从新到旧、金额用元', () => {
    const csv = toCsv([
      e('a', { date: '2026-11-01', amountCents: 5 }),
      e('b', { date: '2026-11-08', type: 'income', category: '工资', amountCents: 1200000 }),
    ]);
    expect(csv).toBe('﻿日期,类型,分类,金额,备注\r\n2026-11-08,收入,工资,12000.00,\r\n2026-11-01,支出,餐饮,0.05,\r\n');
  });

  test('同一天按记的先后，后记的在前', () => {
    const csv = toCsv([e('a', { createdAt: 1, note: '早' }), e('b', { createdAt: 2, note: '晚' })]);
    expect(csv.split('\r\n')[1]).toContain('晚');
  });

  test('逗号、引号、换行要加引号转义', () => {
    const csv = toCsv([e('a', { note: '火锅, "辣"\n很好吃' })]);
    expect(csv).toContain('"火锅, ""辣""\n很好吃"');
  });

  test('公式开头的备注前面加单引号', () => {
    for (const note of ['=1+1', '+86', '-5', '@SUM(A1)']) {
      expect(toCsv([e('a', { note })]).split('\r\n')[1].endsWith(`,'${note}`)).toBe(true);
    }
  });

  test('没有记录时只有表头', () => {
    expect(toCsv([])).toBe('﻿日期,类型,分类,金额,备注\r\n');
  });
});

test('文件名带日期和时间', () => {
  expect(backupFileName(now)).toBe('ledger-backup-20261108-0905.json');
  expect(csvFileName(now)).toBe('ledger-20261108-0905.csv');
});
