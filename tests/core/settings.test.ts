import { currencySymbol, defaultCurrency, DEFAULT_SETTINGS, formatMoney, parseSettings } from '@/core/settings';

describe('defaultCurrency', () => {
  test('手机地区的货币在列表里就用它', () => {
    expect(defaultCurrency('USD', 'zh')).toBe('USD');
    expect(defaultCurrency('GBP', 'en')).toBe('GBP');
  });

  test('不在列表里（如日元）或拿不到时按语言', () => {
    expect(defaultCurrency('JPY', 'zh')).toBe('CNY');
    expect(defaultCurrency('JPY', 'en')).toBe('USD');
    expect(defaultCurrency(null, 'en')).toBe('USD');
    expect(defaultCurrency(undefined, 'zh')).toBe('CNY');
  });
});

test('currencySymbol', () => {
  expect(currencySymbol('CNY')).toBe('¥');
  expect(currencySymbol('HKD')).toBe('HK$');
});

describe('parseSettings', () => {
  test('没有存过：默认跟随系统、自动货币', () => {
    expect(parseSettings(null)).toEqual(DEFAULT_SETTINGS);
  });

  test('正常读出', () => {
    expect(parseSettings(JSON.stringify({ version: 1, lang: 'en', currency: 'EUR' }))).toEqual({
      version: 1,
      lang: 'en',
      currency: 'EUR',
    });
  });

  test('读不懂就用默认值，不报错', () => {
    expect(parseSettings('oops')).toEqual(DEFAULT_SETTINGS);
    expect(parseSettings(JSON.stringify({ version: 2, lang: 'en' }))).toEqual(DEFAULT_SETTINGS);
  });

  test('单个字段不合法，只把这个字段改回默认', () => {
    expect(parseSettings(JSON.stringify({ version: 1, lang: 'fr', currency: 'EUR' }))).toEqual({
      version: 1,
      lang: 'system',
      currency: 'EUR',
    });
    expect(parseSettings(JSON.stringify({ version: 1, lang: 'zh', currency: 'JPY' }))).toEqual({
      version: 1,
      lang: 'zh',
      currency: null,
    });
  });
});

test('formatMoney：负号放在符号前面', () => {
  expect(formatMoney(123456, '¥')).toBe('¥1,234.56');
  expect(formatMoney(-1250, 'HK$')).toBe('-HK$12.50');
  expect(formatMoney(0, '$')).toBe('$0.00');
});
