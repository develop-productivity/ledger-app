import AsyncStorage from '@react-native-async-storage/async-storage';
import { parseConsent, type ConsentRecord } from '@/core/consent';

// 和账本数据、设置分开存；不进备份文件。撤回同意时只清这一个键。
export const CONSENT_KEY = 'ledger.consent.v1';

export async function loadConsent(): Promise<ConsentRecord | null> {
  try {
    return parseConsent(await AsyncStorage.getItem(CONSENT_KEY));
  } catch {
    return null;
  }
}

export function saveConsent(record: ConsentRecord): Promise<void> {
  return AsyncStorage.setItem(CONSENT_KEY, JSON.stringify(record));
}

export function clearConsent(): Promise<void> {
  return AsyncStorage.removeItem(CONSENT_KEY);
}
