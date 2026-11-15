// 日期显示格式。不用 Intl.DateTimeFormat：不同 Android 手机上结果可能不一样，自己拼更可控，也好测。
import { addDays } from '@/core/ledger';
import type { Lang } from '@/core/settings';

const ZH_WEEKDAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
const EN_WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const EN_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function parts(date: string) {
  const [y, m, d] = date.split('-').map(Number);
  return { y, m, d, weekday: new Date(y, m - 1, d).getDay() };
}

/** 列表分组和日期选择用：今天、昨天，其余显示月日和星期；不是今年的加上年份 */
export function dateLabel(date: string, today: string, lang: Lang): string {
  if (date === today) return lang === 'zh' ? '今天' : 'Today';
  if (date === addDays(today, -1)) return lang === 'zh' ? '昨天' : 'Yesterday';
  const { y, m, d, weekday } = parts(date);
  const sameYear = date.slice(0, 4) === today.slice(0, 4);
  if (lang === 'zh') return `${sameYear ? '' : `${y}年`}${m}月${d}日 ${ZH_WEEKDAYS[weekday]}`;
  return `${EN_WEEKDAYS[weekday]}, ${EN_MONTHS[m - 1]} ${d}${sameYear ? '' : `, ${y}`}`;
}

export function monthLabel(monthKey: string, lang: Lang): string {
  const [y, m] = monthKey.split('-').map(Number);
  return lang === 'zh' ? `${y}年${m}月` : `${EN_MONTHS[m - 1]} ${y}`;
}
