import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { ConsentScreen } from '@/components/ConsentScreen';
import { makeConsent, needsConsent } from '@/core/consent';
import { clearConsent, loadConsent, saveConsent } from '@/services/consent';
import { notify } from '@/services/dialog';
import { useSettings } from '@/state/SettingsContext';

type Status = 'loading' | 'needed' | 'granted';

interface ConsentState {
  /** 撤回同意：清除同意记录，回到同意页。本机记录不删除。 */
  withdraw: () => Promise<void>;
}

const ConsentContext = createContext<ConsentState | null>(null);

/**
 * 同意之前只显示同意页，children（包括读账本数据的 LedgerProvider）不挂载。
 * 要放在 SettingsProvider 里面：同意页要用界面语言。
 */
export function ConsentProvider({ children }: { children: ReactNode }) {
  const { t } = useSettings();
  const [status, setStatus] = useState<Status>('loading');

  useEffect(() => {
    let alive = true;
    loadConsent().then((record) => alive && setStatus(needsConsent(record) ? 'needed' : 'granted'));
    return () => {
      alive = false;
    };
  }, []);

  const agree = useCallback(() => {
    setStatus('granted'); // 这次先进入；没存上的话下次再问
    saveConsent(makeConsent(new Date())).catch(() => notify(t.consent.saveFailedTitle, t.consent.saveFailed));
  }, [t]);

  const withdraw = useCallback(async () => {
    try {
      await clearConsent();
      setStatus('needed');
    } catch {
      notify(t.me.failTitle, t.me.withdrawFailed);
    }
  }, [t]);

  const value = useMemo(() => ({ withdraw }), [withdraw]);

  if (status === 'loading') return null;
  if (status === 'needed') return <ConsentScreen onAgree={agree} />;
  return <ConsentContext.Provider value={value}>{children}</ConsentContext.Provider>;
}

export function useConsent(): ConsentState {
  const ctx = useContext(ConsentContext);
  if (!ctx) throw new Error('useConsent 必须在 ConsentProvider 里使用');
  return ctx;
}
