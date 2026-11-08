import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Alert } from 'react-native';
import { mergeEntries } from '@/core/backup';
import { removeEntry, toMonthKey, upsertEntry, type Entry } from '@/core/ledger';
import { loadEntries, saveEntries } from '@/services/storage';

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

  const reload = useCallback(() => {
    setLoadFailed(false);
    loadEntries()
      .then(({ entries, recovered }) => {
        setEntries(entries);
        if (recovered) Alert.alert('数据无法读取', '原数据已备份，账本从空白开始。');
      })
      .catch(() => setLoadFailed(true));
  }, []);

  useEffect(reload, [reload]);

  // entries 为 null 时还没读完，不能保存，否则会用空列表覆盖已有数据
  useEffect(() => {
    if (entries === null) return;
    saveEntries(entries).catch(() => Alert.alert('保存失败', '这次修改可能没有存下来。'));
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
    () => ({ entries, loadFailed, reload, save, remove, mergeIn, month, setMonth }),
    [entries, loadFailed, reload, save, remove, mergeIn, month],
  );

  return <LedgerContext.Provider value={value}>{children}</LedgerContext.Provider>;
}

export function useLedger(): LedgerState {
  const ctx = useContext(LedgerContext);
  if (!ctx) throw new Error('useLedger 必须在 LedgerProvider 里使用');
  return ctx;
}
