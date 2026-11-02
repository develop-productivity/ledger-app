import AsyncStorage from '@react-native-async-storage/async-storage';
import { deserialize, serialize, type Entry } from './ledger';

export const STORAGE_KEY = 'ledger.v1';
export const CORRUPT_KEY = 'ledger.v1.corrupt';

export type LoadResult = { entries: Entry[]; recovered: boolean };

export async function loadEntries(): Promise<LoadResult> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  const data = deserialize(raw);
  if (data) return { entries: data.entries, recovered: false };
  // 备份后清掉原键，否则下次启动会再次覆盖这份备份
  await AsyncStorage.setItem(CORRUPT_KEY, raw ?? '');
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
