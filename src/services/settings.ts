import AsyncStorage from '@react-native-async-storage/async-storage';
import { parseSettings, type Settings } from '@/core/settings';

// 和账本数据（ledger.v1）分开存：这里坏了不影响记录。不进备份文件。
export const SETTINGS_KEY = 'ledger.settings.v1';

export async function loadSettings(): Promise<Settings> {
  try {
    return parseSettings(await AsyncStorage.getItem(SETTINGS_KEY));
  } catch {
    return parseSettings(null);
  }
}

export function saveSettings(settings: Settings): Promise<void> {
  return AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}
