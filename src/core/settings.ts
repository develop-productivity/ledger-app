import { formatCents } from '@/core/ledger';

// 货币只影响显示的符号。金额一律存整数"分"，不存货币。

export const CURRENCIES = [
  { code: 'CNY', symbol: '¥' },
  { code: 'USD', symbol: '$' },
  { code: 'EUR', symbol: '€' },
  { code: 'GBP', symbol: '£' },
  { code: 'HKD', symbol: 'HK$' },
  { code: 'TWD', symbol: 'NT$' },
  { code: 'CAD', symbol: 'CA$' },
  { code: 'AUD', symbol: 'A$' },
  { code: 'SGD', symbol: 'S$' },
] as const;
// 不收日元、韩元：它们没有小数，而 App 的金额都是两位小数

export type CurrencyCode = (typeof CURRENCIES)[number]['code'];
export type Lang = 'zh' | 'en';
export type LangPref = 'system' | Lang;

export function isCurrencyCode(x: unknown): x is CurrencyCode {
  return CURRENCIES.some((c) => c.code === x);
}

export function currencySymbol(code: CurrencyCode): string {
  return CURRENCIES.find((c) => c.code === code)!.symbol;
}

/** 手机地区的货币在列表里就用它；不在就按语言：中文用人民币，其他用美元 */
export function defaultCurrency(deviceCurrency: string | null | undefined, lang: Lang): CurrencyCode {
  if (isCurrencyCode(deviceCurrency)) return deviceCurrency;
  return lang === 'zh' ? 'CNY' : 'USD';
}

export interface Settings {
  version: 1;
  lang: LangPref;
  /** null 表示自动（跟随手机地区） */
  currency: CurrencyCode | null;
}

export const DEFAULT_SETTINGS: Settings = { version: 1, lang: 'system', currency: null };

/** 设置是手机上的偏好，读不懂就用默认值，不报错 */
export function parseSettings(raw: string | null): Settings {
  if (raw === null) return DEFAULT_SETTINGS;
  try {
    const d = JSON.parse(raw);
    if (d?.version !== 1) return DEFAULT_SETTINGS;
    return {
      version: 1,
      lang: d.lang === 'zh' || d.lang === 'en' ? d.lang : 'system',
      currency: isCurrencyCode(d.currency) ? d.currency : null,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

/** 带货币符号的金额：负号放在符号前面，如 -¥12.00、-HK$1,200.50 */
export function formatMoney(cents: number, symbol: string): string {
  return `${cents < 0 ? '-' : ''}${symbol}${formatCents(Math.abs(cents))}`;
}
