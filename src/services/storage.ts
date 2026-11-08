import AsyncStorage from '@react-native-async-storage/async-storage';
import { deserialize, serialize, type Entry } from '@/core/ledger';

export const STORAGE_KEY = 'ledger.v1';
export const CORRUPT_KEY_PREFIX = 'ledger.v1.corrupt.';

export type LoadResult = { entries: Entry[]; recovered: boolean };

export async function loadEntries(now = Date.now()): Promise<LoadResult> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  const data = deserialize(raw);
  if (data) return { entries: data.entries, recovered: false };
  // 每次损坏单独备份，不覆盖以前的；备份后清掉原键，下次启动才不会重复备份
  await AsyncStorage.setItem(CORRUPT_KEY_PREFIX + now, raw ?? '');
  await AsyncStorage.removeItem(STORAGE_KEY);
  return { entries: [], recovered: true };
}

let queue: Promise<void> = Promise.resolve();

// 串行写入：保证最后一次调用的内容最后落盘
export function saveEntries(entries: Entry[]): Promise<void> {
  const text = serialize(entries);
  queue = queue.catch(() => {}).then(() => AsyncStorage.setItem(STORAGE_KEY, text));
  return queue;
}
