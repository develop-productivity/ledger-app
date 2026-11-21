import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Alert } from 'react-native';
import { mergeEntries } from '@/core/backup';
import { removeEntry, toMonthKey, upsertEntry, type Entry } from '@/core/ledger';
import { loadEntries, saveEntries } from '@/services/storage';
import { useSettings } from '@/state/SettingsContext';

interface LedgerState {
  entries: Entry[] | null;
  loadFailed: boolean;
  reload: () => void;
  save: (entry: Entry) => void;
  remove: (id: string) => void;
  /** 恢复备份：按 id 合并，只新增，不删除、不覆盖本机记录 */
  mergeIn: (incoming: Entry[]) => void;
  month: string;
  setMonth: (month: string) => void;
}

const LedgerContext = createContext<LedgerState | null>(null);

export function LedgerProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<Entry[] | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [month, setMonth] = useState(() => toMonthKey(new Date()));
  // 用 ref 拿文本：切换语言不应该让 reload 变化，否则会重新读一遍数据
  const { t } = useSettings();
  const tRef = useRef(t);
  // 在 effect 里更新，不在渲染时改 ref（React 19 的 lint 规则禁止）
  useEffect(() => {
    tRef.current = t;
  }, [t]);

  // 只读数据，不清 loadFailed：清掉失败标志放到 retry 里，避免 effect 里同步 setState
  const load = useCallback(() => {
    loadEntries()
      .then(({ entries, recovered }) => {
        setEntries(entries);
        if (recovered) Alert.alert(tRef.current.load.corruptTitle, tRef.current.load.corruptBody);
      })
      .catch(() => setLoadFailed(true));
  }, []);

  const retry = useCallback(() => {
    setLoadFailed(false);
    load();
  }, [load]);

  useEffect(load, [load]);

  // entries 为 null 时还没读完，不能保存，否则会用空列表覆盖已有数据
  useEffect(() => {
    if (entries === null) return;
    saveEntries(entries).catch(() => Alert.alert(tRef.current.load.saveFailedTitle, tRef.current.load.saveFailedBody));
  }, [entries]);

  const save = useCallback((entry: Entry) => {
    setEntries((prev) => (prev === null ? prev : upsertEntry(prev, entry)));
    setMonth(entry.date.slice(0, 7));
  }, []);

  const remove = useCallback((id: string) => {
    setEntries((prev) => (prev === null ? prev : removeEntry(prev, id)));
  }, []);

  const mergeIn = useCallback((incoming: Entry[]) => {
    setEntries((prev) => (prev === null ? prev : mergeEntries(prev, incoming).entries));
  }, []);

  const value = useMemo(
    () => ({ entries, loadFailed, reload: retry, save, remove, mergeIn, month, setMonth }),
    [entries, loadFailed, retry, save, remove, mergeIn, month],
  );

  return <LedgerContext.Provider value={value}>{children}</LedgerContext.Provider>;
}

export function useLedger(): LedgerState {
  const ctx = useContext(LedgerContext);
  if (!ctx) throw new Error('useLedger 必须在 LedgerProvider 里使用');
  return ctx;
}
