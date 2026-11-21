import { appendLog, formatCrashReport, MAX_LOGS, parseCrashLogs, scrub, toCrashLog, type CrashLog, type CrashInput } from '@/core/crashlog';

const base: CrashInput = {
  error: new Error('boom'),
  isFatal: true,
  now: new Date('2026-11-21T08:00:00.000Z'),
  appVersion: '1.4.0',
  platform: 'android 14',
  model: 'Pixel 8',
  rn: '0.88.1',
};

const log = (over: Partial<CrashLog> = {}): CrashLog => ({
  v: 1,
  ts: '2026-11-21T08:00:00.000Z',
  appVersion: '1.4.0',
  fatal: true,
  error: 'TypeError: boom',
  stack: 'at foo (index.bundle:1:2)',
  platform: 'android 14',
  model: 'Pixel 8',
  rn: '0.88.1',
  ...over,
});

describe('scrub', () => {
  test('遮掉引号里的内容：错误消息常把值拼在引号里', () => {
    expect(scrub(`Cannot read "餐饮" of undefined`)).toBe("Cannot read '…' of undefined");
  });

  test('遮掉数字：金额可能是 1200.50', () => {
    expect(scrub('amount 1200.50 over limit 100')).toBe('amount # over limit #');
  });

  test('遮掉中文和全角字符：分类名、备注', () => {
    expect(scrub('category 餐饮 note 午饭')).toBe('category … note …');
  });

  test('保留英文错误类型，不然看不出是什么错', () => {
    expect(scrub('TypeError: Cannot read property x of undefined')).toBe('TypeError: Cannot read property x of undefined');
  });
});

describe('toCrashLog', () => {
  test('普通错误：记下类型和消息，堆栈截断到前几行', () => {
    const err = new Error('TypeError: boom');
    err.stack = Array.from({ length: 20 }, (_, i) => `at frame${i} (file:${i})`).join('\n');
    const l = toCrashLog({ ...base, error: err });
    expect(l.error).toBe('Error: TypeError: boom');
    expect(l.stack.split('\n')).toHaveLength(8);
    expect(l.stack).toContain('at frame7');
    expect(l.stack).not.toContain('at frame8');
    expect(l.ts).toBe('2026-11-21T08:00:00.000Z');
    expect(l.fatal).toBe(true);
  });

  test('字符串错误也能记', () => {
    expect(toCrashLog({ ...base, error: 'boom 12' }).error).toBe('Error: boom #');
  });

  test('不是 Error 的对象也能记，不会二次崩溃', () => {
    // JSON 里的键名也被当成可能的用户内容遮掉，宁可多遮
    expect(toCrashLog({ ...base, error: { code: 5 } }).error).toBe("NonError: {'…':#}");
  });

  test('循环引用的错误对象不抛异常', () => {
    const cyclic: Record<string, unknown> = {};
    cyclic.self = cyclic;
    expect(() => toCrashLog({ ...base, error: cyclic })).not.toThrow();
  });

  test('错误消息里的用户输入被清洗', () => {
    expect(toCrashLog({ ...base, error: 'bad "午饭" 23.50' }).error).toBe("Error: bad '…' #");
  });

  test('堆栈第一行是错误消息时，不能把用户输入漏出去', () => {
    const err = new Error('Cannot read "餐饮" of undefined');
    err.stack = `Error: Cannot read "餐饮" of undefined\n    at parse (ledger:12:34)\n    at save (ledger:40:8)`;
    const l = toCrashLog({ ...base, error: err });
    expect(l.stack).not.toContain('餐饮');
    expect(l.stack).not.toContain('undefined'); // 带消息的首行整行去掉
    expect(l.stack).toContain('at parse (ledger:12:34)'); // 行号保留，排查靠它
    expect(l.stack).toContain('at save (ledger:40:8)');
  });

  test('堆栈里其它行也不会带出中文和数字金额', () => {
    const err = new Error('x');
    err.stack = 'Error: x\n    at handle ("购物", 1234.5)';
    const l = toCrashLog({ ...base, error: err });
    expect(l.stack).not.toContain('购物');
    expect(l.stack).not.toContain('1234.5');
    expect(l.stack).not.toContain('at handle'); // 整行带用户内容，丢掉
  });
});

describe('parseCrashLogs', () => {
  test('没有记录', () => {
    expect(parseCrashLogs(null)).toEqual([]);
  });

  test('坏数据当作没有，不能让日志拖垮启动', () => {
    expect(parseCrashLogs('{broken')).toEqual([]);
    expect(parseCrashLogs('{"a":1}')).toEqual([]);
  });

  test('丢掉不合法的条目，保留合法的', () => {
    const raw = JSON.stringify([log(), { v: 1 }, 'x', log({ ts: '2026-11-22T00:00:00.000Z' })]);
    expect(parseCrashLogs(raw)).toHaveLength(2);
  });

  test('超过上限只留最新的', () => {
    const many = Array.from({ length: MAX_LOGS + 5 }, (_, i) => log({ ts: `2026-11-${String(i + 1).padStart(2, '0')}T00:00:00.000Z` }));
    expect(parseCrashLogs(JSON.stringify(many))).toHaveLength(MAX_LOGS);
  });
});

describe('appendLog', () => {
  test('新的加在最后', () => {
    const a = log({ ts: '2026-11-21T00:00:00.000Z' });
    const b = log({ ts: '2026-11-22T00:00:00.000Z' });
    expect(appendLog([a], b).map((x) => x.ts)).toEqual([a.ts, b.ts]);
  });

  test('超过上限丢最旧的', () => {
    const logs = [log({ ts: 'a' }), log({ ts: 'b' }), log({ ts: 'c' })];
    expect(appendLog(logs, log({ ts: 'd' }), 3).map((x) => x.ts)).toEqual(['b', 'c', 'd']);
  });
});

describe('formatCrashReport', () => {
  test('最近的排在最上面，带版本和设备信息', () => {
    const report = formatCrashReport([log({ ts: 'old' }), log({ ts: 'new' })]);
    expect(report.indexOf('new')).toBeLessThan(report.indexOf('old'));
    expect(report).toContain('app 1.4.0 · android 14 · Pixel 8 · React Native 0.88.1');
    expect(report).toContain('2 entries');
  });

  test('没有记录时也能生成文件', () => {
    expect(formatCrashReport([])).toContain('0 entries');
  });

  test('读不到的平台信息不留下多余的空分隔符', () => {
    const report = formatCrashReport([log({ platform: 'web', model: '', rn: '' })]);
    expect(report).toContain('app 1.4.0 · web');
    expect(report).not.toContain(' ·  ·');
  });
});
