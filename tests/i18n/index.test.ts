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

  test('英文翻译里没有中文字符', () => {
    const json = JSON.stringify(strings('en'), (key, value) =>
      key === 'expense' || key === 'income' ? Object.values(value as object) : value,
    );
    const values = json.replace(/"[^"]*[一-龥][^"]*":/g, '');
    expect(values).not.toMatch(/[一-龥]/);
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
