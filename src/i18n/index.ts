import type { CsvLabels } from '@/core/backup';
import type { EntryType } from '@/core/ledger';
import type { Lang, LangPref } from '@/core/settings';
import { en } from './en';
import { zh, type Strings } from './zh';

export { dateLabel, monthLabel } from './format';
export type { Strings };

const STRINGS: Record<Lang, Strings> = { zh, en };

export function strings(lang: Lang): Strings {
  return STRINGS[lang];
}

/**
 * 决定界面语言：手动选的 > 手机系统语言列表里第一个支持的 > 英文。
 * deviceLanguages 是系统语言列表的语言代码，如 ['ja', 'zh', 'en']。
 */
export function resolveLang(pref: LangPref, deviceLanguages: (string | null)[]): Lang {
  if (pref !== 'system') return pref;
  for (const code of deviceLanguages) {
    const c = code?.toLowerCase();
    if (c === 'zh' || c === 'en') return c;
  }
  return 'en';
}

/** 数据里存的是中文分类名，显示时翻译；翻译表里没有的（如手工改过的备份）原样显示 */
export function categoryLabel(lang: Lang, type: EntryType, name: string): string {
  const table = STRINGS[lang].categories[type];
  // 只查表里自己的键：手工改过的备份里可能有 "constructor" 这类名字，会查到原型链上的函数
  return Object.prototype.hasOwnProperty.call(table, name) ? table[name] : name;
}

export function csvLabels(lang: Lang): CsvLabels {
  const t = STRINGS[lang];
  return {
    header: t.csv.header,
    type: (type) => t.common.type[type],
    category: (type, name) => categoryLabel(lang, type, name),
  };
}
