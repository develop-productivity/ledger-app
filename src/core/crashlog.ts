// 本地崩溃日志：只存在这台手机上，不联网、不上传。用户能导出，自己决定发给谁。
// 崩溃信息里可能夹带用户输入（备注、金额、分类），所以存之前要清洗。

export const CRASHLOG_VERSION = 1;
/** 最多保留几条，再多就丢最旧的 */
export const MAX_LOGS = 10;
const FIELD_LIMIT = 300;
const STACK_LINES = 8;

export interface CrashLog {
  v: typeof CRASHLOG_VERSION;
  /** 发生时间，ISO 字符串 */
  ts: string;
  appVersion: string;
  fatal: boolean;
  /** 错误类型和消息，已清洗 */
  error: string;
  /** 堆栈，已截断 */
  stack: string;
  /** 如 android 14、iOS 17.2 */
  platform: string;
  /** 设备型号，可能读不到 */
  model: string;
  /** React Native 版本 */
  rn: string;
}

export interface CrashInput {
  error: unknown;
  isFatal: boolean;
  now: Date;
  appVersion: string;
  platform: string;
  model: string;
  rn: string;
}

/**
 * 把可能含用户输入的文字遮掉：
 * - 引号、反引号里的内容（错误消息常把值拼在引号里）
 * - 数字（金额）
 * - 汉字和全角字符（分类名、备注里的中文）
 * 保留英文错误类型和框架文字，不然看不出是什么错。
 */
export function scrub(text: string): string {
  return text
    .replace(/'[^']*'|"[^"]*"|`[^`]*`/g, "'…'")
    .replace(/\d+(?:[.,]\d+)*/g, '#')
    .replace(/[　-鿿＀-￯]+/g, '…');
}

function describe(error: unknown): { name: string; message: string; stack: string } {
  if (error instanceof Error) {
    return { name: error.name || 'Error', message: error.message, stack: error.stack ?? '' };
  }
  if (typeof error === 'string') return { name: 'Error', message: error, stack: '' };
  try {
    return { name: 'NonError', message: JSON.stringify(error) ?? String(error), stack: '' };
  } catch {
    return { name: 'NonError', message: String(error), stack: '' };
  }
}

function truncate(text: string, limit: number): string {
  return text.length > limit ? `${text.slice(0, limit)}…` : text;
}

/**
 * 堆栈：文件路径和行号是排查崩溃的关键，不遮数字。
 * 但会带上用户数据的行要么是 "Error: 消息" 那行，要么整行只在引号里才有用户内容
 * （如 at handle ("购物")），这些行直接丢掉；其余行原样保留行号。
 */
function shortStack(stack: string, message: string): string {
  return stack
    .split('\n')
    .slice(0, STACK_LINES)
    .map((line) => line.trim())
    .filter((line) => {
      if (!line) return false;
      if (message && line === message) return false;
      return !/['"`]|[　-鿿＀-￯]/.test(line);
    })
    .map((line) => truncate(line, FIELD_LIMIT))
    .join('\n');
}

export function toCrashLog(input: CrashInput): CrashLog {
  const { name, message, stack } = describe(input.error);
  const rawError = `${name}: ${message}`;
  return {
    v: CRASHLOG_VERSION,
    ts: input.now.toISOString(),
    appVersion: input.appVersion,
    fatal: input.isFatal,
    error: truncate(scrub(rawError), FIELD_LIMIT),
    stack: shortStack(stack, message),
    platform: input.platform,
    model: input.model,
    rn: input.rn,
  };
}

function isCrashLog(x: unknown): x is CrashLog {
  if (typeof x !== 'object' || x === null) return false;
  const l = x as Record<string, unknown>;
  return (
    l.v === CRASHLOG_VERSION &&
    typeof l.ts === 'string' &&
    typeof l.appVersion === 'string' &&
    typeof l.fatal === 'boolean' &&
    typeof l.error === 'string' &&
    typeof l.stack === 'string' &&
    typeof l.platform === 'string' &&
    typeof l.model === 'string' &&
    typeof l.rn === 'string'
  );
}

/** 读不懂的条目直接丢掉：日志坏了不能影响 App 启动 */
export function parseCrashLogs(raw: string | null): CrashLog[] {
  if (raw === null) return [];
  try {
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) return [];
    return data.filter(isCrashLog).slice(-MAX_LOGS);
  } catch {
    return [];
  }
}

/** 新的加在最后，超过上限丢最旧的 */
export function appendLog(logs: CrashLog[], log: CrashLog, max = MAX_LOGS): CrashLog[] {
  return [...logs, log].slice(-max);
}

/** 导出文件的内容：最近的一条在最上面 */
export function formatCrashReport(logs: CrashLog[]): string {
  const head = `# Ledger crash report\n# ${logs.length} entr${logs.length === 1 ? 'y' : 'ies'}, newest first\n`;
  const body = [...logs]
    .reverse()
    .map((l) => {
      const kind = l.fatal ? 'FATAL' : 'error';
      return [
        ``,
        `## ${l.ts} (${kind})`,
        `app ${[l.appVersion, l.platform, l.model, l.rn && `React Native ${l.rn}`].filter(Boolean).join(' · ')}`,
        l.error,
        l.stack ? `\n${l.stack}` : '',
      ].join('\n');
    })
    .join('\n');
  return `${head}${body}\n`;
}
