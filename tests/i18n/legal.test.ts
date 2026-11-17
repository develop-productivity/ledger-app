/// <reference types="node" />
import fs from 'fs';
import path from 'path';
import { CONTACT, legalDoc, legalMarkdown, type LegalDocId } from '@/i18n/legal';

const FILES: Record<LegalDocId, string> = { privacy: 'PRIVACY.md', terms: 'TERMS.md' };
const root = path.resolve(__dirname, '../..');

describe.each(Object.entries(FILES) as [LegalDocId, string][])('%s', (id, file) => {
  test(`根目录的 ${file} 和 App 内的文本一致`, () => {
    const expected = legalMarkdown(id);
    const target = path.join(root, file);
    if (process.env.UPDATE_LEGAL) fs.writeFileSync(target, expected);
    // 不一致时：改 src/i18n/legal.ts，然后运行 UPDATE_LEGAL=1 npx jest tests/i18n/legal.test.ts
    expect(fs.readFileSync(target, 'utf8')).toBe(expected);
  });

  test('中英文的章节数一样', () => {
    expect(legalDoc('en', id).sections.length).toBe(legalDoc('zh', id).sections.length);
  });

  test('写了联系方式', () => {
    for (const lang of ['zh', 'en'] as const) {
      expect(JSON.stringify(legalDoc(lang, id))).toContain(CONTACT);
    }
  });
});
