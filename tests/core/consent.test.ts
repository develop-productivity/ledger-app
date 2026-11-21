import { makeConsent, needsConsent, parseConsent, POLICY_VERSION } from '@/core/consent';

const now = new Date('2026-11-17T08:00:00.000Z');

test('同意记录往返', () => {
  const r = makeConsent(now);
  expect(parseConsent(JSON.stringify(r))).toEqual({ version: 1, policyVersion: POLICY_VERSION, acceptedAt: '2026-11-17T08:00:00.000Z' });
});

describe('读不懂的记录当作没同意', () => {
  test.each([
    ['没有记录', null],
    ['不是 JSON', 'yes'],
    ['版本不对', JSON.stringify({ version: 2, policyVersion: 1, acceptedAt: 'x' })],
    ['缺 policyVersion', JSON.stringify({ version: 1, acceptedAt: 'x' })],
    ['policyVersion 不是整数', JSON.stringify({ version: 1, policyVersion: '1', acceptedAt: 'x' })],
    ['缺 acceptedAt', JSON.stringify({ version: 1, policyVersion: 1 })],
  ])('%s', (_name, raw) => {
    expect(parseConsent(raw)).toBeNull();
    expect(needsConsent(parseConsent(raw))).toBe(true);
  });
});

describe('needsConsent', () => {
  test('同意过当前版本：不用再问', () => {
    expect(needsConsent(makeConsent(now, 3), 3)).toBe(false);
  });

  test('同意的是旧版本政策：要重新问', () => {
    expect(needsConsent(makeConsent(now, 1), 2)).toBe(true);
  });

  test('记录里的版本比 App 的新（降级安装）：不用再问', () => {
    expect(needsConsent(makeConsent(now, 3), 2)).toBe(false);
  });
});
