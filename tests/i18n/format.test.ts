import { dateLabel, monthLabel } from '@/i18n';

const today = '2026-11-07';

describe('dateLabel', () => {
  test('中文：今天、昨天、同年、跨年', () => {
    expect(dateLabel('2026-11-07', today, 'zh')).toBe('今天');
    expect(dateLabel('2026-11-06', today, 'zh')).toBe('昨天');
    expect(dateLabel('2026-11-05', today, 'zh')).toBe('11月5日 周四');
    expect(dateLabel('2025-12-31', today, 'zh')).toBe('2025年12月31日 周三');
  });

  test('英文：Today、Yesterday、同年、跨年', () => {
    expect(dateLabel('2026-11-07', today, 'en')).toBe('Today');
    expect(dateLabel('2026-11-06', today, 'en')).toBe('Yesterday');
    expect(dateLabel('2026-11-05', today, 'en')).toBe('Thu, Nov 5');
    expect(dateLabel('2025-12-31', today, 'en')).toBe('Wed, Dec 31, 2025');
  });

  test('跨年的昨天也算昨天', () => {
    expect(dateLabel('2025-12-31', '2026-01-01', 'en')).toBe('Yesterday');
  });
});

test('monthLabel', () => {
  expect(monthLabel('2026-03', 'zh')).toBe('2026年3月');
  expect(monthLabel('2026-03', 'en')).toBe('Mar 2026');
  expect(monthLabel('2026-12', 'en')).toBe('Dec 2026');
});
