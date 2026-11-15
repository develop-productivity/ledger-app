import { CATEGORIES, type EntryType } from '@/core/ledger';
import { categoryLabel, resolveLang, strings } from '@/i18n';

describe('resolveLang', () => {
  test('手动选了就用手动的', () => {
    expect(resolveLang('zh', ['en'])).toBe('zh');
    expect(resolveLang('en', ['zh'])).toBe('en');
  });

  test('跟随系统：取系统语言列表里第一个支持的', () => {
    expect(resolveLang('system', ['zh'])).toBe('zh');
    expect(resolveLang('system', ['ja', 'zh', 'en'])).toBe('zh');
    expect(resolveLang('system', ['fr', 'en', 'zh'])).toBe('en');
    expect(resolveLang('system', ['ZH'])).toBe('zh');
  });

  test('系统语言都不支持时用英文', () => {
    expect(resolveLang('system', ['ja', 'ko'])).toBe('en');
    expect(resolveLang('system', [null])).toBe('en');
    expect(resolveLang('system', [])).toBe('en');
  });
});

describe('分类翻译', () => {
  test.each(['zh', 'en'] as const)('%s：每个分类都有翻译', (lang) => {
    for (const type of ['expense', 'income'] as EntryType[]) {
      for (const name of CATEGORIES[type]) {
        expect(strings(lang).categories[type][name]).toBeTruthy();
      }
    }
  });

  test('中文原样显示，英文翻译', () => {
    expect(categoryLabel('zh', 'expense', '餐饮')).toBe('餐饮');
    expect(categoryLabel('en', 'expense', '餐饮')).toBe('Food');
    expect(categoryLabel('en', 'income', '其他')).toBe('Other');
  });

  test('翻译表里没有的分类原样显示', () => {
    expect(categoryLabel('en', 'expense', '宠物')).toBe('宠物');
  });

  test('英文翻译里没有中文字符（包括带参数的文本）', () => {
    // 分类表的键是数据里的中文名，只检查值；函数用样例参数调用一次再检查
    const found: string[] = [];
    const walk = (v: unknown, path: string): void => {
      if (typeof v === 'string') {
        if (/[\u4e00-\u9fa5]/.test(v)) found.push(`${path}: ${v}`);
      } else if (typeof v === 'function') {
        walk(v.length >= 2 ? v(3, 1) : v.length === 1 ? v(2) : v(), path);
        if (v.length === 1) walk(v('expense'), path + '(expense)');
      } else if (v && typeof v === 'object') {
        for (const [k, child] of Object.entries(v)) walk(child, `${path}.${k}`);
      }
    };
    walk(strings('en'), 'en');
    expect(found).toEqual([]);
  });

  test('分类名是 constructor 这类原型链上的名字，也原样显示', () => {
    expect(categoryLabel('en', 'expense', 'constructor')).toBe('constructor');
    expect(categoryLabel('en', 'income', 'toString')).toBe('toString');
  });
});

describe('英文的单复数', () => {
  const t = strings('en');
  test('1 条用 record，多条用 records', () => {
    expect(t.me.restoreDoneBody(1)).toBe('1 record added.');
    expect(t.me.restoreDoneBody(3)).toBe('3 records added.');
    expect(t.stats.caption(1, 'Food')).toBe('1 record, most in Food');
  });
});
