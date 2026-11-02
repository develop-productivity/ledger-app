import {
  deserialize,
  entriesOfMonth,
  formatCents,
  groupByDate,
  parseAmount,
  serialize,
  shiftMonth,
  summarize,
  toDateString,
  type Entry,
} from './ledger';

const e = (over: Partial<Entry>): Entry => ({
  id: Math.random().toString(36),
  type: 'expense',
  amountCents: 100,
  category: '餐饮',
  note: '',
  date: '2026-11-02',
  createdAt: 0,
  ...over,
});

describe('parseAmount', () => {
  test.each([
    ['12', 1200],
    ['12.3', 1230],
    ['12.34', 1234],
    [' 0.01 ', 1],
    ['0.1', 10],
  ])('%s -> %d 分', (input, cents) => {
    expect(parseAmount(input)).toBe(cents);
  });

  test.each(['', '0', '0.00', 'abc', '1.234', '-5', '1e3', '1,000', '.5', '100000000.01'])(
    '拒绝 %p',
    (input) => {
      expect(parseAmount(input)).toBeNull();
    },
  );

  test('上限 1 亿元可以记', () => {
    expect(parseAmount('100000000')).toBe(100_000_000_00);
  });
});

test('formatCents 两位小数和千分位', () => {
  expect(formatCents(1)).toBe('0.01');
  expect(formatCents(123456)).toBe('1,234.56');
  expect(formatCents(-2350)).toBe('-23.50');
});

test('toDateString 用本地日期', () => {
  expect(toDateString(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05');
});

test('shiftMonth 跨年', () => {
  expect(shiftMonth('2026-01', -1)).toBe('2025-12');
  expect(shiftMonth('2026-12', 1)).toBe('2027-01');
});

test('entriesOfMonth 筛选并按日期、创建时间倒序', () => {
  const list = [
    e({ id: 'a', date: '2026-11-01', createdAt: 1 }),
    e({ id: 'b', date: '2026-10-31', createdAt: 2 }),
    e({ id: 'c', date: '2026-11-02', createdAt: 3 }),
    e({ id: 'd', date: '2026-11-02', createdAt: 4 }),
  ];
  expect(entriesOfMonth(list, '2026-11').map((x) => x.id)).toEqual(['d', 'c', 'a']);
});

test('summarize 收入、支出、结余', () => {
  const s = summarize([
    e({ type: 'income', amountCents: 10000 }),
    e({ type: 'expense', amountCents: 2350 }),
    e({ type: 'expense', amountCents: 10 }),
  ]);
  expect(s).toEqual({ income: 10000, expense: 2360, balance: 7640 });
});

test('groupByDate 相邻同日合并', () => {
  const g = groupByDate([e({ date: '2026-11-02' }), e({ date: '2026-11-02' }), e({ date: '2026-11-01' })]);
  expect(g.map((x) => [x.date, x.items.length])).toEqual([
    ['2026-11-02', 2],
    ['2026-11-01', 1],
  ]);
});

describe('deserialize', () => {
  test('没有数据时返回空账本', () => {
    expect(deserialize(null)).toEqual({ version: 1, entries: [] });
  });

  test('和 serialize 往返一致', () => {
    const list = [e({ id: 'x', note: '午饭' })];
    expect(deserialize(serialize(list))?.entries).toEqual(list);
  });

  test.each([
    ['不是 JSON', '{oops'],
    ['版本不对', JSON.stringify({ version: 2, entries: [] })],
    ['entries 不是数组', JSON.stringify({ version: 1, entries: {} })],
    ['金额是小数', JSON.stringify({ version: 1, entries: [{ ...e({}), amountCents: 1.5 }] })],
    ['类型不认识', JSON.stringify({ version: 1, entries: [{ ...e({}), type: 'gift' }] })],
    ['缺字段', JSON.stringify({ version: 1, entries: [{ id: 'x' }] })],
    ['null', 'null'],
  ])('%s 时返回 null', (_name, raw) => {
    expect(deserialize(raw)).toBeNull();
  });
});
