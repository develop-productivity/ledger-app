// 全局错误钩子：把崩溃写进本机存储，供「我的」页面导出。不联网，不发送任何数据。
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { appendLog, parseCrashLogs, toCrashLog, type CrashLog, type CrashInput } from '@/core/crashlog';

export const CRASHLOG_KEY = 'ledger.crashlog.v1';

type ErrorUtilsLike = { getGlobalHandler: () => (error: unknown, isFatal: boolean) => void; setGlobalHandler: (h: (e: unknown, isFatal: boolean) => void) => void };

function device(): { platform: string; model: string; rn: string } {
  const c = Platform.constants as unknown as Record<string, unknown> | undefined;
  const rn = c?.reactNativeVersion as { major?: number; minor?: number; patch?: number } | undefined;
  const version = typeof Platform.Version === 'number' ? Platform.Version : '';
  // 网页预览（Platform.Version 是 0）不写版本，免得出现 "web 0.0.0"
  const os = version === '' || version === 0 ? '' : ` ${version}`;
  return {
    platform: `${Platform.OS}${os}`.trim(),
    model: typeof c?.Model === 'string' ? c.Model : '',
    rn: rn ? `${rn.major ?? 0}.${rn.minor ?? 0}.${rn.patch ?? 0}` : '',
  };
}

export async function loadCrashLogs(): Promise<CrashLog[]> {
  try {
    return parseCrashLogs(await AsyncStorage.getItem(CRASHLOG_KEY));
  } catch {
    return [];
  }
}

async function record(input: Omit<CrashInput, 'appVersion' | 'platform' | 'model' | 'rn'>): Promise<void> {
  const logs = await loadCrashLogs();
  const log = toCrashLog({ ...input, appVersion: Constants.expoConfig?.version ?? '', ...device() });
  await AsyncStorage.setItem(CRASHLOG_KEY, JSON.stringify(appendLog(logs, log)));
}

export async function clearCrashLogs(): Promise<void> {
  await AsyncStorage.removeItem(CRASHLOG_KEY);
}

let installed = false;

/**
 * 装在模块顶层：注册得越早，越能接住启动阶段的错误。
 * 两条路径都接：手机上错误走 ErrorUtils 的全局处理器；网页上错误直接交给浏览器
 * （window.onerror / unhandledrejection），所以两个都装。写入失败时吞掉并打 console
 * （不能再报错，否则会循环），原来的展示（红屏、浏览器报错）保持不变。
 */
export function installCrashHandler(): void {
  if (installed) return;
  installed = true;

  const handler = (error: unknown, isFatal: boolean) => {
    record({ error, isFatal, now: new Date() }).catch(() => {
      // 写日志失败不能再报错（否则会循环），静默丢掉这一条
    });
  };

  const EU = (globalThis as unknown as { ErrorUtils?: ErrorUtilsLike }).ErrorUtils;
  if (EU?.setGlobalHandler) {
    const previous = EU.getGlobalHandler();
    EU.setGlobalHandler((error, isFatal) => {
      handler(error, isFatal);
      previous(error, isFatal);
    });
  }

  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const onError = (event: ErrorEvent) => {
      handler(event.error ?? event.message, true);
      // 不调 preventDefault：浏览器控制台照常显示，开发时的红屏也不受影响
    };
    const onRejection = (event: PromiseRejectionEvent) => {
      handler(event.reason, false);
    };
    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection);
  }
}
