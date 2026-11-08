import { breakdown, dailyTotals, donutSegments } from '@/core/chart';
import type { Entry } from '@/core/ledger';

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

describe('breakdown', () => {
  test('按分类合计、按金额倒序，只算指定类型', () => {
    const s = breakdown(
      [
        e({ category: '餐饮', amountCents: 300 }),
        e({ category: '交通', amountCents: 500 }),
        e({ category: '餐饮', amountCents: 200 }),
        e({ type: 'income', category: '工资', amountCents: 9999 }),
      ],
      'expense',
    );
    expect(s).toEqual([
      { category: '餐饮', cents: 500, ratio: 0.5 },
      { category: '交通', cents: 500, ratio: 0.5 },
    ].sort((a, b) => a.category.localeCompare(b.category)));
    expect(s.reduce((x, y) => x + y.ratio, 0)).toBeCloseTo(1);
  });

  test('没有记录时返回空数组', () => {
    expect(breakdown([], 'expense')).toEqual([]);
    expect(breakdown([e({ type: 'income' })], 'expense')).toEqual([]);
  });
});

describe('donutSegments', () => {
  const r = 50;
  const C = 2 * Math.PI * r;
  const lens = (segs: { dashArray: string }[]) => segs.map((s) => Number(s.dashArray.split(' ')[0]));

  test('各段首尾相接，总长等于周长', () => {
    const segs = donutSegments([0.5, 0.3, 0.2], r);
    expect(lens(segs).reduce((a, b) => a + b, 0)).toBeCloseTo(C);
    expect(segs[0].dashOffset).toBeCloseTo(0);
    expect(segs[1].dashOffset).toBeCloseTo(-0.5 * C);
    expect(segs[2].dashOffset).toBeCloseTo(-0.8 * C);
  });

  test('只有一段时画满整圈，不留间隙', () => {
    const [seg] = donutSegments([1], r, 2);
    expect(lens([seg])[0]).toBeCloseTo(C);
  });

  test('有间隙时每段少画一点，极小的段不出现负数', () => {
    const segs = donutSegments([0.9999, 0.0001], r, 2);
    expect(lens(segs)[0]).toBeCloseTo(0.9999 * C - 2);
    expect(lens(segs)[1]).toBe(0);
  });
});

describe('dailyTotals', () => {
  test('按日期累加，长度等于当月天数', () => {
    const days = dailyTotals(
      [
        e({ date: '2026-02-01', amountCents: 100 }),
        e({ date: '2026-02-01', amountCents: 50 }),
        e({ date: '2026-02-28', amountCents: 7 }),
        e({ date: '2026-03-01', amountCents: 999 }),
        e({ date: '2026-02-10', type: 'income', amountCents: 999 }),
      ],
      '2026-02',
      'expense',
    );
    expect(days).toHaveLength(28);
    expect(days[0]).toBe(150);
    expect(days[27]).toBe(7);
    expect(days[9]).toBe(0);
  });

  test('闰年二月 29 天', () => {
    expect(dailyTotals([], '2028-02', 'expense')).toHaveLength(29);
  });
});
