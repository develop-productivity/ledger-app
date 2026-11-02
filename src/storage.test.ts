import AsyncStorage from '@react-native-async-storage/async-storage';
import { CORRUPT_KEY_PREFIX, STORAGE_KEY, loadEntries, saveEntries } from './storage';
import type { Entry } from './ledger';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

const entry: Entry = {
  id: 'a',
  type: 'expense',
  amountCents: 2350,
  category: '餐饮',
  note: '午饭',
  date: '2026-11-02',
  createdAt: 1,
};

beforeEach(() => AsyncStorage.clear());

test('第一次打开是空账本', async () => {
  expect(await loadEntries()).toEqual({ entries: [], recovered: false });
});

test('保存后能读回', async () => {
  await saveEntries([entry]);
  expect((await loadEntries()).entries).toEqual([entry]);
});

test('连续保存时最后一次生效', async () => {
  saveEntries([entry]);
  saveEntries([]);
  await saveEntries([{ ...entry, id: 'b' }]);
  expect((await loadEntries()).entries.map((e) => e.id)).toEqual(['b']);
});

test('数据损坏时先备份原文，再从空白开始', async () => {
  await AsyncStorage.setItem(STORAGE_KEY, '{broken');
  expect(await loadEntries(1)).toEqual({ entries: [], recovered: true });
  expect(await AsyncStorage.getItem(CORRUPT_KEY_PREFIX + 1)).toBe('{broken');
  expect(await AsyncStorage.getItem(STORAGE_KEY)).toBeNull();
});

test('第二次损坏不覆盖第一次的备份', async () => {
  await AsyncStorage.setItem(STORAGE_KEY, '{first');
  await loadEntries(1);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 2, entries: [] }));
  await loadEntries(2);
  expect(await AsyncStorage.getItem(CORRUPT_KEY_PREFIX + 1)).toBe('{first');
  expect(await AsyncStorage.getItem(CORRUPT_KEY_PREFIX + 2)).toContain('"version":2');
});
